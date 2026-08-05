import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  FaImage,
  FaPaperPlane,
  FaMicrophone,
  FaStop,
  FaTrash,
  FaPlay,
  FaPause,
  FaMapMarkerAlt,
  FaLocationArrow,
} from "react-icons/fa";
import { FaSmile } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import EmojiPicker from "emoji-picker-react";

function MessageInput({
  chatId,
  receiverId,
  senderId,
  replyMessage,
  setReplyMessage,
  onMessageSent,
}) {
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingSecondsRef = useRef(0);
  const audioPreviewRef = useRef(null);
  const typingTimeout = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Recorded audio
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  const [audioReady, setAudioReady] = useState(false);
const [isLiveLocation, setIsLiveLocation] = useState(false);
const watchIdRef = useRef(null);

  const { socket } = useSocket();
const { theme } = useTheme();
  // =========================
  // FILE / IMAGE SELECT
  // =========================

  const handleImage = (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    setAttachments(files);
  };

  // =========================
  // EMOJI
  // =========================

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // =========================
  // START RECORDING
  // =========================

 const getSupportedMimeType = () => {
    // Prefer formats that are reliably both RECORDABLE and PLAYABLE
    // in the same browser. Safari can sometimes record webm/opus but
    // cannot play it back (causes "NotSupportedError" on the exact
    // same device), so we explicitly pick a format the browser itself
    // supports for playback too, instead of trusting MediaRecorder's default.
    const candidates = [
      "audio/mp4",
      "audio/aac",
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];

    for (const mime of candidates) {
      if (
        window.MediaRecorder &&
        MediaRecorder.isTypeSupported &&
        MediaRecorder.isTypeSupported(mime)
      ) {
        return mime;
      }
    }
    return "";
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Microphone is not supported by this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = getSupportedMimeType();

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
  const blob = new Blob(audioChunksRef.current, {
    type: mediaRecorder.mimeType || "audio/webm",
  });

  console.log("🎤 Recorded blob:", blob);
  console.log("🎤 Blob size:", blob.size);
  console.log("🎤 Blob type:", blob.type);

  if (blob.size === 0) {
    toast.error("Voice recording is empty");
    return;
  }

  const url = URL.createObjectURL(blob);

  console.log("🎤 Audio URL:", url);

  setAudioBlob(blob);
  setAudioUrl(url);

  // MediaRecorder webm blobs often report duration as Infinity/NaN
  // in <audio>.onLoadedMetadata (a known Chrome bug), so use the
  // seconds we actually counted while recording as the source of truth.
  setAudioDuration(recordingSecondsRef.current);

  stream.getTracks().forEach((track) => track.stop());
};

      mediaRecorder.start();

      setIsRecording(true);
      setRecordingTime(0);
      recordingSecondsRef.current = 0;

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch (error) {
      console.error("MIC ERROR:", error);

      if (error.name === "NotAllowedError") {
        toast.error("Microphone permission denied.");
      } else if (error.name === "NotFoundError") {
        toast.error("No microphone device found.");
      } else {
        toast.error("Unable to access microphone.");
      }
    }
  };

  // =========================
  // STOP RECORDING
  // =========================

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    clearInterval(recordingTimerRef.current);

    setIsRecording(false);
  };

  // =========================
  // CANCEL / DELETE RECORDING
  // =========================

  const cancelRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    clearInterval(recordingTimerRef.current);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    audioChunksRef.current = [];

    setAudioBlob(null);
    setAudioUrl("");
    setAudioReady(false);
    setIsRecording(false);
    setRecordingTime(0);
    recordingSecondsRef.current = 0;
    setIsAudioPlaying(false);
    setAudioDuration(0);
    setAudioCurrentTime(0);

    audioChunksRef.current = [];

    mediaRecorderRef.current = null;
  };


 const toggleAudioPreview = () => {
  if (!audioPreviewRef.current) return;

  if (isAudioPlaying) {
    audioPreviewRef.current.pause();
  } else {
    audioPreviewRef.current.play();
  }
};

const deleteAudioPreview = () => {
  if (audioPreviewRef.current) {
    audioPreviewRef.current.pause();
    audioPreviewRef.current.currentTime = 0;
  }

  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
  }

  setAudioBlob(null);
  setAudioUrl("");
  setIsAudioPlaying(false);
  setAudioDuration(0);
  setAudioCurrentTime(0);
  setRecordingTime(0);
  recordingSecondsRef.current = 0;

  audioChunksRef.current = [];
  mediaRecorderRef.current = null;
};


const handleAudioLoaded = (e) => {
  setAudioDuration(Math.floor(e.target.duration));
};

const handleAudioPlay = () => {
  setIsAudioPlaying(true);
};

const handleAudioPause = () => {
  setIsAudioPlaying(false);
};

const handleAudioEnded = () => {
  setIsAudioPlaying(false);
};

  // =========================
  // AUDIO PREVIEW PLAY / PAUSE
  // =========================

 
  // =========================
  // FORMAT TIME
  // =========================

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) {
      return "0:00";
    }

    const minutes = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${secs}`;
  };



const startLiveLocation = () => {
  if (!navigator.geolocation) {
    toast.error("Geolocation is not supported by this browser.");
    return;
  }

  if (!socket || !receiverId) {
    toast.error("Socket connection is not available.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;

        // Start live location in backend
        await api.post(
          `/chat/${chatId}/live-location/start`,
          {
            latitude,
            longitude,
            duration: 60 * 60, // 1 hour
          }
        );

        // Tell receiver live location started
        socket.emit("startLiveLocation", {
          chatId,
          receiverId,
        });

        // Start watching movement
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;

            socket.emit("liveLocationUpdate", {
              chatId,
              receiverId,
              latitude,
              longitude,
            });
          },
          (error) => {
            console.error("LIVE LOCATION ERROR:", error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
          }
        );

        watchIdRef.current = watchId;

        setIsLiveLocation(true);

        toast.success("Live location started");
      } catch (error) {
        console.error("START LIVE LOCATION ERROR:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to start live location"
        );
      }
    },
    (error) => {
      console.error("LOCATION ERROR:", error);

      if (error.code === 1) {
        toast.error("Location permission denied.");
      } else if (error.code === 2) {
        toast.error("Unable to get your location.");
      } else if (error.code === 3) {
        toast.error("Location request timed out.");
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }
  );
};


const stopLiveLocation = async () => {
  try {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    await api.post(
      `/chat/${chatId}/live-location/stop`
    );

    socket.emit("stopLiveLocation", {
      chatId,
      receiverId,
    });

    setIsLiveLocation(false);

    toast.success("Live location stopped");
  } catch (error) {
    console.error("STOP LIVE LOCATION ERROR:", error);

    toast.error(
      error.response?.data?.message ||
        "Failed to stop live location"
    );
  }
};

  // =========================
  // SEND MESSAGE
  // =========================

  const sendMessage = async () => {
    if (
      !text.trim() &&
      attachments.length === 0 &&
      !audioBlob
    ) {
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      // Text
      formData.append("text", text);

      // Reply
      if (replyMessage) {
        formData.append("replyTo", replyMessage._id);
      }

      // Normal attachments
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      // =========================
      // VOICE MESSAGE
      // =========================

      if (audioBlob) {
  console.log("🎤 AUDIO BLOB READY:", audioBlob);

  const audioFile = new File(
    [audioBlob],
    `voice-${Date.now()}.webm`,
    {
      type: "audio/webm",
    }
  );

  console.log("🎤 AUDIO FILE:", audioFile);

  formData.append("attachments", audioFile);
  formData.append(
    "duration",
    String(Math.round(audioDuration || recordingSecondsRef.current))
  );
}

      const { data } = await api.post(
        `/messages/${chatId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // =========================
      // RESET
      // =========================

      setText("");
      setAttachments([]);

      audioChunksRef.current = [];

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioBlob(null);
      setAudioUrl("");
      setRecordingTime(0);
      recordingSecondsRef.current = 0;
      setAudioDuration(0);
      setAudioCurrentTime(0);
      setIsAudioPlaying(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setReplyMessage(null);

      if (onMessageSent) {
        onMessageSent(data.message);
      }
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to send message"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ENTER TO SEND
  // =========================

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // =========================
  // TYPING
  // =========================

  const handleTextChange = (e) => {
    const value = e.target.value;

    setText(value);

    if (!socket || !receiverId) return;

    socket.emit("typing", {
      receiverId,
      senderId,
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", {
        receiverId,
        senderId,
      });
    }, 1000);
  };


  const shareLocation = () => {
  if (!navigator.geolocation) {
    toast.error("Location is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        setLoading(true);

        const { latitude, longitude } = position.coords;

        const formData = new FormData();

        formData.append("text", "");
        formData.append("latitude", latitude);
        formData.append("longitude", longitude);

        const { data } = await api.post(
          `/messages/${chatId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (onMessageSent) {
          onMessageSent(data.message);
        }

        toast.success("Location shared 📍");
      } catch (error) {
        console.error("LOCATION SHARE ERROR:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to share location"
        );
      } finally {
        setLoading(false);
      }
    },
    (error) => {
      console.error("LOCATION ERROR:", error);

      if (error.code === 1) {
        toast.error("Please allow location permission.");
      } else if (error.code === 2) {
        toast.error("Unable to get your location.");
      } else {
        toast.error("Location request timed out.");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};


useEffect(() => {
  return () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );
    }
  };
}, []);

useEffect(() => {
  if (!window.visualViewport) return;

  const handleViewportResize = () => {
    const viewport = window.visualViewport;

    const keyboardHeight =
      window.innerHeight - viewport.height - viewport.offsetTop;

    setKeyboardHeight(
      keyboardHeight > 100 ? keyboardHeight : 0
    );
  };

  window.visualViewport.addEventListener(
    "resize",
    handleViewportResize
  );

  window.visualViewport.addEventListener(
    "scroll",
    handleViewportResize
  );

  handleViewportResize();

  return () => {
    window.visualViewport.removeEventListener(
      "resize",
      handleViewportResize
    );

    window.visualViewport.removeEventListener(
      "scroll",
      handleViewportResize
    );
  };
}, []);


  // =========================
  // UI
  // =========================

   return (
  <div
    className="
      border-t border-gray-200 dark:border-gray-700
      bg-white dark:bg-gray-900
      p-4
      transition-colors
      shrink-0
      lg:static
      fixed
      left-0
      right-0
      z-[60]
    "
    style={{
      bottom:
        keyboardHeight > 0
          ? `${keyboardHeight}px`
          : "64px",
    }}
  >
      {/* =========================
          REPLY PREVIEW
      ========================= */}

      {replyMessage && (
        <div className="mb-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-600 flex justify-between items-center">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              Replying to {replyMessage.sender?.name}
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {replyMessage.text ||
                (replyMessage.attachments?.[0]?.type ===
                "audio"
                  ? "🎤 Voice message"
                  : replyMessage.attachments?.[0]?.type ===
                    "video"
                  ? "🎥 Video"
                  : replyMessage.attachments?.[0]?.type ===
                    "file"
                  ? "📄 File"
                  : "📷 Photo")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setReplyMessage(null)}
            className="text-red-500 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================
          ATTACHMENT PREVIEW
      ========================= */}

      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              {file.name}
            </div>
          ))}
        </div>
      )}

      {/* =========================
          RECORDING UI
      ========================= */}

      {isRecording && (
        <div className="mb-3 flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 rounded-xl">

          {/* Waveform */}
          <div className="flex gap-1 items-center">
            <span className="w-1 h-3 bg-red-500 animate-pulse rounded" />
            <span className="w-1 h-5 bg-red-500 animate-pulse rounded" />
            <span className="w-1 h-4 bg-red-500 animate-pulse rounded" />
            <span className="w-1 h-6 bg-red-500 animate-pulse rounded" />
            <span className="w-1 h-3 bg-red-500 animate-pulse rounded" />
          </div>

          {/* Timer */}
          <span className="text-red-600 font-medium text-sm">
            {formatTime(recordingTime)}
          </span>

          {/* Delete */}
          <button
            type="button"
            onClick={cancelRecording}
            className="text-red-600 ml-auto"
          >
            <FaTrash />
          </button>

          {/* Stop */}
          <button
            type="button"
            onClick={stopRecording}
            className="bg-red-500 text-white p-2 rounded-full"
          >
            <FaStop size={12} />
          </button>
        </div>
      )}

      {/* =========================
          AUDIO PREVIEW
      ========================= */}

      {!isRecording && audioBlob && audioUrl && (
  <div className="mb-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 rounded-xl">

   <audio
  ref={audioPreviewRef}
  src={audioUrl}
  preload="auto"
  onLoadedMetadata={(e) => {
    const duration = e.currentTarget.duration;

    console.log("🎵 AUDIO DURATION:", duration);

    if (Number.isFinite(duration) && duration > 0) {
      setAudioDuration(duration);
    }
  }}
  onCanPlay={() => {
    console.log("🎵 AUDIO READY TO PLAY");
    setAudioReady(true);
  }}
  onTimeUpdate={(e) => {
    setAudioCurrentTime(e.currentTarget.currentTime);
  }}
  onPlay={() => {
    setIsAudioPlaying(true);
  }}
  onPause={() => {
    setIsAudioPlaying(false);
  }}
  onEnded={() => {
    setIsAudioPlaying(false);
    setAudioCurrentTime(0);
  }}
/>
    {/* Play / Pause */}
 {/* Play / Pause */}
    <button
  type="button"
  onClick={async () => {
    const audio = audioPreviewRef.current;

    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error("AUDIO PLAY ERROR:", error);
    }
  }}
  className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
>
  {isAudioPlaying ? (
    <FaPause size={13} />
  ) : (
    <FaPlay size={13} className="ml-0.5" />
  )}
</button>

    {/* Waveform */}
    <div className="flex items-center gap-[2px] flex-1 h-8">
      {[6, 10, 14, 9, 17, 8, 13, 6, 15, 10, 17, 7, 12, 9, 6].map(
        (height, index) => {
          const progress =
            audioDuration > 0
              ? (audioCurrentTime / audioDuration) * 15
              : 0;

          return (
            <span
              key={index}
              className={`w-[3px] rounded-full ${
                index < progress
                  ? "bg-blue-600"
                  : "bg-blue-300"
              }`}
              style={{
                height: `${height}px`,
              }}
            />
          );
        }
      )}
    </div>

    {/* Duration */}
    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[35px]">
      {formatTime(audioDuration)}
    </span>

    {/* Delete */}
    <button
      type="button"
      onClick={deleteAudioPreview}
      className="text-red-500 p-2"
    >
      <FaTrash />
    </button>

  </div>
)}

      {/* =========================
          MAIN INPUT
      ========================= */}

      <div className="flex items-center gap-3">

        {/* Image / File */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-blue-600 text-xl"
        >
          <FaImage />
        </button>

        <button
  type="button"
  onClick={shareLocation}
  disabled={loading}
  className="text-red-500 text-xl disabled:opacity-50"
  title="Share location"
>
  <FaMapMarkerAlt />
</button>

{/* Live Location */}
<button
  type="button"
  onClick={
    isLiveLocation
      ? stopLiveLocation
      : startLiveLocation
  }
  disabled={loading}
  className={`text-xl ${
    isLiveLocation
      ? "text-red-500"
      : "text-green-600"
  }`}
  title={
    isLiveLocation
      ? "Stop Live Location"
      : "Share Live Location"
  }
>
  <FaLocationArrow />
</button>

        {/* Emoji */}
        <button
          type="button"
          onClick={() =>
            setShowEmojiPicker(!showEmojiPicker)
          }
          className="text-yellow-500 text-xl"
        >
          <FaSmile />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50">
           <EmojiPicker
  onEmojiClick={handleEmojiClick}
  theme={theme === "dark" ? "dark" : "light"}
/>
</div>
        )}

        {/* File Input */}
        <input
          ref={fileInputRef}
          hidden
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={handleImage}
        />

        {/* Text */}
        <textarea
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Mic */}
        {!isRecording && !audioBlob && (
          <button
            type="button"
            onClick={startRecording}
            disabled={loading}
            className="text-blue-600 text-xl"
          >
            <FaMicrophone />
          </button>
        )}

        {/* Send */}
        <button
          type="button"
          disabled={
            loading ||
            (!text.trim() &&
              attachments.length === 0 &&
              !audioBlob)
          }
          onClick={sendMessage}
          className="bg-blue-600 text-white p-3 rounded-full disabled:opacity-50"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
