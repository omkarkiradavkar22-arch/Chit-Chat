import { useAuth } from "../../context/AuthContext";
import {
  FaCheck,
  FaCheckDouble,
  FaReply,
  FaEllipsisV,
  FaEdit,
  FaCopy,
  FaSmile,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaLocationArrow,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import ForwardModal from "./ForwardModal";
import { FaPlay, FaPause } from "react-icons/fa";
import { useSocket } from "../../context/SocketContext";

function VoiceMessagePlayer({ url, isMine, duration: knownDuration }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(knownDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };


  // Fixed bar heights so the waveform looks the same every render
  const bars = [6, 10, 14, 9, 16, 7, 12, 5, 11, 8, 15, 6, 13, 9, 7];
  const progress = duration ? (currentTime / duration) * bars.length : 0;

  return (
    <div
 className={`flex items-center gap-3 rounded-full px-3 py-2 min-w-0 w-full max-w-full sm:min-w-[210px] ${
          isMine
  ? "bg-blue-500"
  : "bg-gray-100 dark:bg-gray-700"
      }`}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.target.duration;
          if (!knownDuration && Number.isFinite(d) && d > 0) {
            setDuration(d);
          }
        }}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${
          isMine ? "bg-white text-blue-600" : "bg-blue-600 text-white"
        }`}
      >
        {isPlaying ? (
          <FaPause size={12} />
        ) : (
          <FaPlay size={12} className="ml-0.5" />
        )}
      </button>

      <div className="flex items-end gap-[2px] flex-1 h-6">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-colors ${
              i < progress
                ? isMine
                  ? "bg-white"
                  : "bg-blue-600"
                : isMine
                ? "bg-blue-200"
                : "bg-blue-300"
            } ${isPlaying ? "animate-pulse" : ""}`}
            style={{
              height: `${h}px`,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      <span
        className={`text-xs shrink-0 ${
          isMine
  ? "text-blue-100"
  : "text-gray-500 dark:text-gray-300"
        }`}
      >
        {formatTime(currentTime > 0 ? currentTime : duration)}
      </span>
    </div>
  );
}

function MessageBubble({
  message,
  chatId,
  onReply,
  onDelete,
  onEdit,
  onReaction,
  refreshChatInfo,
  searchQuery,
  isSearchMatch,
  liveLocation,
}) {
    const { user } = useAuth();
    const { socket } = useSocket();

  const isMine = message.sender?._id === user?._id;
const [showMenu, setShowMenu] = useState(false);
const [editing, setEditing] = useState(false);
const [editedText, setEditedText] = useState(message.text);
//const [liveLocation, setLiveLocation] = useState(null);
const emojis = ["❤️", "😂", "👍", "🔥", "😮", "😢"];
  const isSeen =
    message.seenBy &&
    message.seenBy.length > 1;

const imageAttachments =
  message.attachments?.filter(
    (file) => file.type === "image"
  ) || [];

const handleDeleteForMe = async () => {
  try {
    await api.delete(`/messages/${message._id}/me`);

    toast.success("Deleted for you");
    setShowMenu(false);

onDelete(message._id);
  } catch (err) {
    toast.error("Delete failed");
  }
};

const handleDeleteForEveryone = async () => {
  try {
    const { data } = await api.delete(
      `/messages/${message._id}/everyone`
    );

    onEdit(data.message);

    setShowMenu(false);

    toast.success("Deleted for everyone");
  } catch (err) {
    toast.error(
      err.response?.data?.message || "Delete failed"
    );
  }
};

const handleCreateTask = async () => {
  try {
    const { data } = await api.post("/tasks", {
      chat: chatId,
      message: message._id,
      title: message.text,
      deadline: null,
    });

    toast.success("✅ Task created successfully");

    console.log("Created task:", data);
  } catch (error) {
    console.error("Create task error:", error);

    toast.error(
      error.response?.data?.message ||
        "Failed to create task"
    );
  }
};

const handleEdit = async () => {
  try {
    const { data } = await api.put(
      `/messages/${message._id}`,
      {
        text: editedText,
      }
    );

    onEdit(data.message);

    setEditing(false);
    setShowMenu(false);

    toast.success("Message updated");
  } catch (err) {
    toast.error("Failed");
  }
};

const handleCopy = async () => {
  await navigator.clipboard.writeText(message.text);

  toast.success("Copied");
};

const [showEmoji, setShowEmoji] = useState(false);
const [showForward, setShowForward] = useState(false);
const [fullImage, setFullImage] = useState(null);
const [fullImageIndex, setFullImageIndex] = useState(0);
const handleReaction = async (emoji) => {
  try {
    const { data } = await api.put(
      `/messages/${message._id}/react`,
      { emoji }
    );

onReaction(data.message);
    setShowEmoji(false);

    toast.success("Reaction added");
  } catch (err) {
    toast.error("Failed");
  }
};

const renderMessageText = (text) => {
  if (!text) return null;

  // URL + Phone Number
  const regex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?|\+?\d[\d\s-]{8,}\d)/gi;

  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // =========================
    // URL
    // =========================
    const isUrl =
      /^https?:\/\//i.test(part) ||
      /^www\./i.test(part) ||
      /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(part);

    if (isUrl) {
      // Remove punctuation accidentally attached to URL
      const match = part.match(/^(.+?)([.,!?;:]?)$/);

      const url = match?.[1] || part;
      const punctuation = match?.[2] || "";

      const href = /^https?:\/\//i.test(url)
        ? url
        : `https://${url}`;

      return (
        <span key={index}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline font-medium break-all ${
              isMine
                ? "text-white hover:text-blue-100"
                : "text-blue-600 hover:text-blue-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
          {punctuation}
        </span>
      );
    }

    // =========================
    // PHONE NUMBER
    // =========================
    const isPhone = /^\+?\d[\d\s-]{8,}\d$/.test(part);

    if (isPhone) {
      const phone = part.replace(/[^\d+]/g, "");

      return (
        <a
          key={index}
          href={`tel:${phone}`}
          className={`underline font-medium ${
            isMine
              ? "text-white hover:text-blue-100"
              : "text-blue-600 hover:text-blue-800"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

const renderHighlightedText = () => {
  if (!message.text) return null;

  if (!searchQuery?.trim()) {
    return message.text;
  }

  const query = searchQuery.trim();

  const parts = message.text.split(
    new RegExp(`(${query})`, "gi")
  );

  return parts.map((part, index) => {
    const isMatch =
      part.toLowerCase() === query.toLowerCase();

    return isMatch ? (
      <mark
        key={index}
        className="bg-yellow-300 text-black rounded px-1"
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    );
  });
};

  return (
    <div
      className={`flex ${
        isMine
          ? "justify-end"
          : "justify-start"
      } mb-3`}
    >

      {fullImage && (
  <div
    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
    onClick={() => setFullImage(null)}
  >
    {/* Close Button */}
    <button
      type="button"
      onClick={() => setFullImage(null)}
      className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl"
    >
      ✕
    </button>

    {/* Full Image */}
    <img
      src={fullImage}
      alt="Full preview"
      className="max-w-full max-h-[90vh] object-contain rounded-lg"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
)}
      <div
 className={`relative group min-w-0 max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow transition-all ${
     isSearchMatch
      ? "ring-4 ring-yellow-400 ring-offset-2"
      : ""
  } ${
    isMine
  ? "bg-blue-600 text-white"
  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
  }`}
>
        
        {/* Reply Button */}
<button
  onClick={() => onReply(message)}
  className="absolute -bottom-2 -right-2 hidden group-hover:flex bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 p-2 rounded-full shadow"
>
  <FaReply size={12} />
</button>

{/* Three Dot Menu Button */}
{!message.deletedForEveryone && (
  <button
    onClick={() => setShowMenu(!showMenu)}
    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
  >
    <FaEllipsisV size={14} />
  </button>
)}

{/* =========================
    LIVE LOCATION
========================= */}

{liveLocation?.active &&
  message.location?.latitude != null &&
  message.location?.longitude != null && (
  <div
    className={`mb-2 rounded-xl overflow-hidden border ${
      isMine
  ? "bg-blue-500 border-blue-400"
  : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    }`}
  >
    <div className="p-3">

      <div className="flex items-center gap-2">
        <FaLocationArrow
          className={isMine ? "text-white" : "text-green-600"}
        />

        <p
          className={`font-semibold text-sm ${
            isMine ? "text-white" : "text-green-700"
          }`}
        >
          📍 Live Location
        </p>
      </div>

      {liveLocation.latitude != null &&
        liveLocation.longitude != null && (
          <>
            <p
              className={`text-xs mt-2 ${
                isMine ? "text-green-100" : "text-gray-600"
              }`}
            >
              {Number(liveLocation.latitude).toFixed(5)},{" "}
              {Number(liveLocation.longitude).toFixed(5)}
            </p>

            <a
              href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-white text-green-700 hover:bg-gray-100"
            >
              🗺️ Open Live Location
            </a>
          </>
        )}

      <p
        className={`text-xs mt-2 ${
          isMine ? "text-green-100" : "text-green-600"
        }`}
      >
        🟢 Location is being shared live
      </p>

    </div>
  </div>
)}



{!message.deletedForEveryone &&
  message.location?.latitude != null &&
  message.location?.longitude != null && (
    <div
      className={`mb-2 rounded-xl overflow-hidden border ${
        isMine
          ? "bg-blue-500 border-blue-400"
          : "bg-gray-100 border-gray-200"
      }`}
    >
      {/* Map Preview */}
      <div className="h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
        <FaMapMarkerAlt
          className="text-red-500 drop-shadow-md"
          size={42}
        />

        <span className="absolute bottom-2 left-2 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded-md shadow">
          📍 Shared Location
        </span>
      </div>

      {/* Location Details */}
      <div className="p-3">
        <p
          className={`font-semibold text-sm ${
            isMine ? "text-white" : "text-gray-800"
          }`}
        >
          📍 Location
        </p>

        <p
          className={`text-xs mt-1 ${
            isMine ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {Number(message.location.latitude).toFixed(5)},{" "}
          {Number(message.location.longitude).toFixed(5)}
        </p>

        <a
          href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
          target="_blank"
          rel="noreferrer"
          className={`mt-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isMine
              ? "bg-white text-blue-600 hover:bg-blue-50"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          🗺️ Open in Google Maps
        </a>
      </div>
    </div>
  )}
  
        {!message.deletedForEveryone &&
  message.attachments?.length > 0 && (
    <div className="mb-2 space-y-2">
      {message.attachments.map((file, index) => (
        <div key={index}>

          {/* Image */}
 {file.type === "image" && (
  <img
    src={file.url}
    alt={file.originalName || "Image"}
    onClick={() => {
      const index = imageAttachments.findIndex(
        (img) => img.url === file.url
      );

      setFullImageIndex(index >= 0 ? index : 0);
      setFullImage(file.url);
    }}
    className="rounded-xl max-h-72 max-w-full object-cover cursor-pointer hover:opacity-90 transition"
  />
)}

          {/* Video */}
          {file.type === "video" && (
            <video 
              controls
              className="rounded-xl max-h-72 max-w-full"
            >
              <source src={file.url} />
              Your browser does not support video playback.
            </video>
          )}

          {/* Voice Message */}
          {file.type === "audio" && (
            <VoiceMessagePlayer
              url={file.url}
              isMine={isMine}
              duration={file.duration}
            />
          )}

          {/* File / PDF / DOC / TXT / ZIP */}
          {file.type === "file" && (
  <a
    href={file.url}
    target="_blank"
    rel="noopener noreferrer"
 className={`flex items-center gap-3 rounded-xl px-3 py-3 min-w-0 w-full max-w-full sm:min-w-[240px] sm:max-w-[320px] transition ${
        isMine
        ? "bg-blue-500 hover:bg-blue-400 text-white"
        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
    }`}
  >
    {/* PDF / File Icon */}
    <div
      className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
        isMine
          ? "bg-white/20"
          : "bg-white"
      }`}
    >
      <span className="text-2xl">📄</span>
    </div>

    {/* File Details */}
    <div className="min-w-0 flex-1">
      <p
        className={`text-sm font-semibold truncate ${
          isMine ? "text-white" : "text-gray-800"
        }`}
        title={file.originalName || "File"}
      >
        {file.originalName || "File"}
      </p>

      <div className="flex items-center gap-2 mt-1">
        {file.size && (
          <span
            className={`text-xs ${
              isMine ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        )}

        <span
          className={`text-xs ${
            isMine ? "text-blue-100" : "text-gray-500"
          }`}
        >
          • Open
        </span>
      </div>
    </div>

    {/* Open icon */}
    <FaExternalLinkAlt
      size={13}
      className={`shrink-0 ${
        isMine ? "text-white" : "text-gray-500"
      }`}
    />
  </a>
)}

        </div>
      ))}
    </div>
  )}

{showMenu && (
  <div className="absolute top-8 right-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-44 z-50">

    <button
      onClick={handleDeleteForMe}
      className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      🗑 Delete for Me
    </button>

    <button
onClick={()=>{
handleCopy();
setShowMenu(false);
}}
className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
>
📋 Copy
</button>

<button
  onClick={async () => {
    try {
      const { data } = await api.post(
        `/messages/${message._id}/star`
      );
      onEdit({
        ...message,
        starredBy: data.starred
          ? [...(message.starredBy || []), user._id]
          : (message.starredBy || []).filter(
              (id) => id !== user._id
            ),
      });
      setShowMenu(false);
      toast.success(data.starred ? "Message starred" : "Message unstarred");
    } catch (err) {
      toast.error("Failed to star message");
    }
  }}
  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
>
  {message.starredBy?.includes(user._id) ? "⭐ Unstar" : "☆ Star Message"}
</button>

<button
  onClick={() => {
    setShowForward(true);
    setShowMenu(false);
  }}
  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
>
  ➡️ Forward
</button>

<button
  onClick={async () => {
    try {
      await api.post(
        `/chat/${message.chat}/pin/${message._id}`
      );

      await refreshChatInfo();

      setShowMenu(false);

      toast.success("Message pinned");
    } catch (err) {
      toast.error("Failed to pin");
    }
  }}
  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
>
  📌 Pin Message
</button>

<button
  onClick={handleCreateTask}
  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
>
  ✅ Create Task
</button>

    {isMine && (
      <button
        onClick={handleDeleteForEveryone}
        className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
      >
        ❌ Delete for Everyone
      </button>
    )}

    {isMine && (
<button
onClick={()=>{
setEditing(true);
setShowMenu(false);
}}
className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
>
✏️ Edit Message
</button>
)}

<button
  onClick={() => {
  setShowEmoji(!showEmoji);
  setShowMenu(false);
}}
  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
>
  ❤️ React
</button>

  </div>
)}

{showEmoji && (
  <div className="absolute top-10 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg flex p-2 gap-2 z-50">
    {emojis.map((emoji) => (
      <button
        key={emoji}
        onClick={() => handleReaction(emoji)}
        className="text-xl hover:scale-125 transition"
      >
        {emoji}
      </button>
    ))}
  </div>
)}


        {/* Reply Preview */}
        {message.replyTo && (
          <div
            className={`mb-3 border-l-4 pl-3 py-2 rounded ${
              isMine
  ? "bg-blue-500 hover:bg-blue-400"
  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <p className="text-xs font-semibold">
              {message.replyTo.sender?.name}
            </p>

            {message.replyTo.text && (
              <p className="text-sm truncate">
                {message.replyTo.text}
              </p>
            )}

            {message.replyTo.attachments?.length > 0 && (
  <p className="text-sm italic">
    📎 Attachment
  </p>
)}
          </div>
        )}
{message.forwardedFrom && (
  <p
    className={`text-xs italic mb-1 ${
      isMine ? "text-blue-100" : "text-gray-500"
    }`}
  >
    ↪ Forwarded
  </p>
)}

        {/* Text */}
        {message.deletedForEveryone ? (
  <p className="italic text-gray-300 dark:text-gray-400">
    🚫 This message was deleted
  </p>
) : editing ? (
  <>
    <input
      value={editedText}
      onChange={(e) =>
        setEditedText(e.target.value)
      }
      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 w-full outline-none"
    />

    <button
      onClick={handleEdit}
      className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded"
    >
      Save
    </button>
  </>
) : (
 <p className="break-words overflow-wrap-anywhere">
  {renderMessageText(message.text)}
</p>
)}

{message.reactions?.length > 0 && (
  <div className="flex gap-1 mt-2 flex-wrap">
    {message.reactions.map((reaction, index) => (
      <span
        key={index}
        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 rounded-full text-sm shadow"
      >
        {reaction.emoji}
      </span>
    ))}
  </div>
)}

        {/* Footer */}
        <div
          className={`flex justify-end items-center gap-2 mt-2 text-xs ${
            isMine
              ? "text-blue-100"
              : "text-gray-500"
          }`}
        >
         {message.isEdited && (
            <span>Edited</span>
          )}

          {message.starredBy?.includes(user._id) && (
            <span title="Starred">⭐</span>
          )}


          <span>
            {new Date(
              message.createdAt
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {/* <button
  onClick={() => onReply(message)}
  className="text-xs underline"
>
  Reply
</button>

{isMine && (
  <button
    onClick={handleDelete}
    className="text-red-500 text-xs underline ml-3"
  >
    Delete
  </button>
)} */}
          {isMine &&
            (isSeen ? (
              <FaCheckDouble className="text-blue-200" />
            ) : (
              <FaCheck />
            ))}

        </div>
      </div>
      {fullImage && (
  <div
    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
    onClick={() => setFullImage(null)}
  >
    {/* CLOSE BUTTON */}
    <button
      type="button"
      onClick={() => setFullImage(null)}
      className="absolute top-5 right-5 z-[10000] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition"
    >
      ✕
    </button>

    {/* LEFT ARROW */}
    {imageAttachments.length > 1 && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();

          const newIndex =
            fullImageIndex === 0
              ? imageAttachments.length - 1
              : fullImageIndex - 1;

          setFullImageIndex(newIndex);
          setFullImage(imageAttachments[newIndex].url);
        }}
        className="absolute left-5 top-1/2 -translate-y-1/2 z-[10000] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
      >
        <FaChevronLeft size={22} />
      </button>
    )}

    {/* IMAGE */}
    <img
      src={fullImage}
      alt="Full preview"
      className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg select-none"
      onClick={(e) => e.stopPropagation()}
    />

    {/* RIGHT ARROW */}
    {imageAttachments.length > 1 && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();

          const newIndex =
            fullImageIndex === imageAttachments.length - 1
              ? 0
              : fullImageIndex + 1;

          setFullImageIndex(newIndex);
          setFullImage(imageAttachments[newIndex].url);
        }}
        className="absolute right-5 top-1/2 -translate-y-1/2 z-[10000] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
      >
        <FaChevronRight size={22} />
      </button>
    )}

    {/* IMAGE COUNTER */}
    {imageAttachments.length > 1 && (
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full">
        {fullImageIndex + 1} / {imageAttachments.length}
      </div>
    )}
  </div>
)}
            <ForwardModal
  open={showForward}
  onClose={() => setShowForward(false)}
  messageId={message._id}
/>
    </div>
  );
}

export default MessageBubble;