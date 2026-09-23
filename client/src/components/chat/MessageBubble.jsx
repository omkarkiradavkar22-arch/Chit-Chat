import { useAuth } from "../../context/AuthContext";
import {
  FaCheck,
  FaCheckDouble,
  FaReply,
  FaEllipsisV,
  FaChevronDown,
  FaEdit,
  FaCopy,
  FaSmile,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaLocationArrow,
  FaChevronLeft,
  FaChevronRight,
  FaRegFileImage,
  FaTrash,
  FaArrowRight,
  FaPen,
  FaBan,
  FaShare,
  FaVideo,
  FaDownload,
  FaMicrophone,
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaFileArchive,
  FaFile,
  FaTimes,

  
} from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import ForwardModal from "./ForwardModal";
import { FaPlay, FaPause } from "react-icons/fa";
import { useSocket } from "../../context/SocketContext";

function CachedChatImage({ file,isMine, onOpen }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const formatFileSize = (bytes) => {
    if (!bytes) return "Photo";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} kB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    let active = true;

    const checkImage = async () => {
      try {
        // ONLINE → normal image load
        if (navigator.onLine) {
          if (active) {
            setImageSrc(file.url);
            setIsCached(true);
          }
          return;
        }

        // OFFLINE → only check existing browser/SW cache
        if ("caches" in window) {
          const cachedResponse = await caches.match(file.url);

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const objectUrl = URL.createObjectURL(blob);

            if (active) {
              setImageSrc(objectUrl);
              setIsCached(true);
            }

            return;
          }
        }

        if (active) {
          setImageSrc(null);
          setIsCached(false);
        }
      } catch (error) {
        console.error("Image cache check failed:", error);

        if (active) {
          setImageSrc(null);
          setIsCached(false);
        }
      }
    };

    checkImage();

    return () => {
      active = false;
    };
  }, [file.url]);

  const downloadImage = async (e) => {
    e.stopPropagation();

    if (!navigator.onLine) {
      toast.error("Connect to internet to download this photo");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(file.url);

      if (!response.ok) {
        throw new Error("Image download failed");
      }

      const cache = await caches.open("chitchat-images");

      await cache.put(
        file.url,
        response.clone()
      );

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setImageSrc(objectUrl);
      setIsCached(true);

      toast.success("Photo downloaded");
    } catch (error) {
      console.error("Photo download error:", error);
      toast.error("Failed to download photo");
    } finally {
      setLoading(false);
    }
  };

  if (isCached && imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={file.originalName || "Image"}
        onClick={onOpen}
        className="
          rounded-xl
          max-h-72
          max-w-full
          object-cover
          cursor-pointer
          hover:opacity-90
          transition
        "
      />
    );
  }

  return (
    <div
      className="
        relative
        w-[280px]
        max-w-full
        h-[180px]
        rounded-xl
        overflow-hidden
        bg-gray-300
        dark:bg-gray-700
        flex
        items-center
        justify-center
      "
    >
      {/* blurred placeholder */}
      <div
        className="
          absolute inset-0
          bg-gray-400/40
          dark:bg-gray-600/50
          blur-xl
        "
      />

      <button
        type="button"
        onClick={downloadImage}
        disabled={loading}
        className="
          relative z-10
          flex items-center
          gap-2
          rounded-full
          bg-black/40
          hover:bg-black/50
          text-white
          px-4 py-3
          text-sm
          font-semibold
          transition
          disabled:opacity-60
        "
      >
        <span className="text-lg">
  {downloading ? (
    <span className="animate-spin">◌</span>
  ) : (
    <FaDownload size={17} />
  )}
</span>

        <span>
          {loading
            ? "Downloading..."
            : formatFileSize(file.size)}
        </span>
      </button>
    </div>
  );
}

function VideoViewer({
  videoUrl,
  file,
  onClose,
  onDownload,
}) {
  const formatFileSize = (bytes) => {
    if (!bytes) return "";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} kB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    // Background scrolling बंद
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = oldOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="
        fixed inset-0
        z-[9999]
        bg-black
        flex flex-col
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* =========================
          TOP HEADER
      ========================= */}
      <div
        className="
          flex items-center justify-between
          px-4 sm:px-8
          py-4
          shrink-0
        "
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="
              w-11 h-11
              rounded-full
              bg-white/10
              flex items-center justify-center
              text-xl
              shrink-0
            "
          >
            <FaVideo size={20} />
          </div>

          <div className="min-w-0">
            <p
              className="
                text-white
                font-semibold
                text-sm sm:text-base
                truncate
                max-w-[220px] sm:max-w-[500px]
              "
            >
              {file.originalName || "Video"}
            </p>

            {file.size && (
              <p className="text-gray-400 text-xs mt-1">
                {formatFileSize(file.size)}
              </p>
            )}
          </div>
        </div>

        {/* CLOSE */}
        <button
          type="button"
          onClick={onClose}
          className="
            w-10 h-10
            sm:w-11 sm:h-11
            rounded-full
            bg-white/10
            hover:bg-white/20
            text-white
            text-2xl
            flex items-center justify-center
            transition
            shrink-0
          "
          aria-label="Close video"
        >
          <FaTimes size={18} />
        </button>
      </div>

      {/* =========================
          VIDEO AREA
      ========================= */}
      <div
        className="
          flex-1
          min-h-0
          flex items-center justify-center
          px-3 sm:px-8
          py-3
        "
      >
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="
            w-auto
            h-auto
            max-w-full
            max-h-full
            rounded-xl
            bg-black
            object-contain
          "
        >
          Your browser does not support video playback.
        </video>
      </div>

      {/* =========================
          BOTTOM ACTION BAR
      ========================= */}
      <div
        className="
          shrink-0
          border-t border-white/10
          px-4 sm:px-8
          py-4
          flex justify-end
        "
      >
        <button
          type="button"
          onClick={onDownload}
          className="
            flex items-center gap-2
            px-5 py-3
            rounded-xl
            border border-white/30
            bg-white/5
            hover:bg-white/10
            text-white
            font-semibold
            text-sm
            transition
          "
        >
          <FaDownload size={16} />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}

function CachedAttachment({ file, isMine }) {
  const [cachedUrl, setCachedUrl] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const objectUrlRef = useRef(null);
  const [showVideoViewer, setShowVideoViewer] = useState(false);
  const formatFileSize = (bytes) => {
    if (!bytes) return "";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} kB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileLabel = () => {
    const name = file.originalName || "";

    if (file.type === "video") return "Video";
    if (file.type === "audio") return "Voice message";

    const extension =
      name.split(".").pop()?.toUpperCase() || "FILE";

    return extension;
  };

  const getFileIcon = () => {
  const name = (file.originalName || "").toLowerCase();

  if (file.type === "video") {
    return <FaVideo size={20} />;
  }

  if (file.type === "audio") {
    return <FaMicrophone size={20} />;
  }

  if (name.endsWith(".pdf")) {
    return <FaFilePdf size={21} />;
  }

  if (
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return <FaFileWord size={21} />;
  }

  if (name.endsWith(".txt")) {
    return <FaFileAlt size={21} />;
  }

  if (
    name.endsWith(".zip") ||
    name.endsWith(".rar") ||
    name.endsWith(".7z")
  ) {
    return <FaFileArchive size={21} />;
  }

  return <FaFile size={21} />;
};

  const loadFromCache = async () => {
    try {
      setChecking(true);

      if (!("caches" in window)) {
        setIsCached(false);
        return;
      }

      const response = await caches.match(file.url);

      if (!response) {
        setIsCached(false);
        setCachedUrl(null);
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      objectUrlRef.current = objectUrl;

      setCachedUrl(objectUrl);
      setIsCached(true);
    } catch (error) {
      console.error("Attachment cache check error:", error);
      setIsCached(false);
      setCachedUrl(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadFromCache();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [file.url]);

  const downloadAttachment = async (e) => {
    e?.stopPropagation();

    if (!navigator.onLine) {
      toast.error(
        `Connect to internet to download this ${
          file.type === "audio"
            ? "voice message"
            : file.type
        }`
      );
      return;
    }

    try {
      setDownloading(true);

      const response = await fetch(file.url);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const cache = await caches.open(
        "chitchat-attachments"
      );

      await cache.put(
        file.url,
        response.clone()
      );

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      objectUrlRef.current = objectUrl;

      setCachedUrl(objectUrl);
      setIsCached(true);

      toast.success("Downloaded for offline use");
    } catch (error) {
      console.error(
        "Attachment download error:",
        error
      );

      toast.error("Failed to download");
    } finally {
      setDownloading(false);
    }
  };

  const downloadToDevice = async (e) => {
  e.stopPropagation();

  if (!navigator.onLine) {
    toast.error("Connect to internet to download this file");
    return;
  }

  try {
    const response = await fetch(file.url);

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = file.originalName || "attachment";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);

    toast.success("File downloaded");
  } catch (error) {
    console.error("File download error:", error);
    toast.error("Failed to download file");
  }
};

const openFile = async (e) => {
  e.stopPropagation();

  try {
    let response = null;

    // First try browser cache
    if ("caches" in window) {
      response = await caches.match(file.url);
    }

    // Not cached? Fetch online
    if (!response) {
      if (!navigator.onLine) {
        toast.error("Connect to internet to open this file");
        return;
      }

      response = await fetch(file.url);

      if (!response.ok) {
        throw new Error("Failed to open file");
      }
    }

    const arrayBuffer = await response.arrayBuffer();

    // PDF ला explicitly application/pdf MIME type देतो
    const isPdf =
      file.originalName
        ?.toLowerCase()
        .endsWith(".pdf");

    const blob = new Blob(
      [arrayBuffer],
      {
        type: isPdf
          ? "application/pdf"
          : response.headers.get("content-type") ||
            "application/octet-stream",
      }
    );

    const blobUrl = URL.createObjectURL(blob);

    window.open(
      blobUrl,
      "_blank",
      "noopener,noreferrer"
    );

    // लगेच revoke करू नको,
    // browser ला file load करण्यासाठी वेळ दे
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);

  } catch (error) {
    console.error("File open error:", error);
    toast.error("Failed to open file");
  }
};
  // =========================
// MY SENT ATTACHMENT
// =========================

if (isMine) {
  if (file.type === "video") {
  return (
    <>
      {/* CHAT VIDEO PREVIEW */}
      <div
        onClick={() => setShowVideoViewer(true)}
        className="
          relative
          rounded-xl
          overflow-hidden
          cursor-pointer
          bg-black
          max-w-[300px]
          group
        "
      >
        <video
          src={file.url}
          preload="metadata"
          muted
          playsInline
          className="
            rounded-xl
            max-h-72
            w-full
            object-cover
          "
        />

        {/* PLAY BUTTON */}
        <div
          className="
            absolute inset-0
            flex items-center justify-center
            bg-black/10
            group-hover:bg-black/20
            transition
          "
        >
          <div
            className="
              w-14 h-14
              rounded-full
              bg-black/55
              text-white
              flex items-center justify-center
              text-2xl
              backdrop-blur-sm
            "
          >
            <FaPlay size={18} className="ml-0.5" />
          </div>
        </div>
      </div>

      {/* FULL SCREEN VIEWER */}
      {showVideoViewer && (
        <VideoViewer
          videoUrl={file.url}
          file={file}
          onClose={() => setShowVideoViewer(false)}
          onDownload={downloadToDevice}
        />
      )}
    </>
  );
}

  if (file.type === "audio") {
    return (
      <VoiceMessagePlayer
        url={file.url}
        isMine={true}
        duration={file.duration}
      />
    );
  }

  if (file.type === "file") {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="
          flex items-center gap-3
          rounded-xl
          px-3 py-3
          min-w-0
          w-full
          max-w-full
          sm:min-w-[240px]
          sm:max-w-[320px]
          bg-blue-500
          hover:bg-blue-400
          text-white
          transition
        "
      >
        <div
          className="
            w-11 h-11
            rounded-lg
            flex items-center justify-center
            shrink-0
            text-2xl
            bg-white/20
          "
        >
          {getFileIcon()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">
            {file.originalName || "File"}
          </p>

          <p className="text-xs text-blue-100 mt-1">
            {getFileLabel()}
            {file.size
              ? ` • ${formatFileSize(file.size)}`
              : ""}
            {" • Open"}
          </p>
        </div>

        <FaExternalLinkAlt size={13} />
      </a>
    );
  }
}
  // =========================
  // CACHED VIDEO
  // =========================

  if (
  !checking &&
  isCached &&
  cachedUrl &&
  file.type === "video"
) {
  return (
    <>
      {/* CHAT VIDEO PREVIEW */}
      <div
        onClick={() => setShowVideoViewer(true)}
        className="
          relative
          rounded-xl
          overflow-hidden
          cursor-pointer
          bg-black
          max-w-[300px]
          group
        "
      >
        <video
          src={cachedUrl}
          preload="metadata"
          muted
          playsInline
          className="
            rounded-xl
            max-h-72
            w-full
            object-cover
          "
        />

        {/* PLAY BUTTON */}
        <div
          className="
            absolute inset-0
            flex items-center justify-center
            bg-black/10
            group-hover:bg-black/20
            transition
          "
        >
          <div
            className="
              w-14 h-14
              rounded-full
              bg-black/55
              text-white
              flex items-center justify-center
              text-2xl
              backdrop-blur-sm
            "
          >
            ▶
          </div>
        </div>
      </div>

      {/* FULL SCREEN VIEWER */}
      {showVideoViewer && (
        <VideoViewer
          videoUrl={cachedUrl}
          file={file}
          onClose={() => setShowVideoViewer(false)}
          onDownload={downloadToDevice}
        />
      )}
    </>
  );
}

  // =========================
  // CACHED VOICE MESSAGE
  // =========================

  if (
    !checking &&
    isCached &&
    cachedUrl &&
    file.type === "audio"
  ) {
    return (
      <VoiceMessagePlayer
        url={cachedUrl}
        isMine={isMine}
        duration={file.duration}
      />
    );
  }

   // =========================
  // CACHED FILE
  // =========================

  if (
    !checking &&
    isCached &&
    cachedUrl &&
    file.type === "file"
  ) {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl px-3 py-3 min-w-0 w-full max-w-full sm:min-w-[240px] sm:max-w-[340px] transition ${
          isMine
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
        }`}
      >
        {/* FILE ICON */}
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-2xl ${
            isMine
              ? "bg-white/20"
              : "bg-white dark:bg-gray-600"
          }`}
        >
          {getFileIcon()}
        </div>

        {/* FILE INFO */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">
            {file.originalName || "File"}
          </p>

          <p
            className={`text-xs mt-1 ${
              isMine
                ? "text-blue-100"
                : "text-gray-500 dark:text-gray-300"
            }`}
          >
            {getFileLabel()}

            {file.size
              ? ` • ${formatFileSize(file.size)}`
              : ""}
          </p>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 mt-2">

            {/* OPEN CACHED FILE */}
        {(
  file.originalName?.toLowerCase().endsWith(".pdf") ||
  file.originalName?.toLowerCase().endsWith(".txt")
) && (
  <button
    type="button"
    onClick={openFile}
    className="text-xs font-semibold hover:underline"
  >
    Open
  </button>
)}

            {/* DOWNLOAD TO DEVICE */}
            <button
              type="button"
              onClick={downloadToDevice}
              className="text-xs font-semibold hover:underline"
            >
              Download
            </button>

          </div>
        </div>

        <FaExternalLinkAlt size={13} />
      </div>
    );
  }

  // =========================
  // NOT CACHED
  // =========================

  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-xl
        ${
          file.type === "video"
            ? "w-[280px] max-w-full h-[180px]"
            : "w-full min-w-0 sm:min-w-[240px] sm:max-w-[320px]"
        }
        ${
          isMine
            ? "bg-blue-500"
            : "bg-gray-100 dark:bg-gray-700"
        }
      `}
    >
      {file.type === "video" ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <div
            className="
              absolute inset-0
              bg-gray-500/50
              backdrop-blur-xl
            "
          />

          <button
            type="button"
            onClick={downloadAttachment}
            disabled={downloading || checking}
            className="
              relative z-10
              flex items-center gap-2
              px-4 py-3
              rounded-full
              bg-black/45
              hover:bg-black/60
              text-white
              text-sm
              font-semibold
              transition
              disabled:opacity-60
            "
          >
            <span className="text-lg">
             {downloading ? (
  <span className="animate-spin">◌</span>
) : (
  <FaDownload size={16} />
)}
            </span>

            <span>
              {downloading
                ? "Downloading..."
                : formatFileSize(file.size) ||
                  "Video"}
            </span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-3 py-3">
          <div
            className={`
              w-11 h-11
              rounded-lg
              flex items-center justify-center
              shrink-0
              text-2xl
              ${
                isMine
                  ? "bg-white/20"
                  : "bg-white dark:bg-gray-600"
              }
            `}
          >
            {getFileIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold truncate ${
                isMine
                  ? "text-white"
                  : "text-gray-800 dark:text-white"
              }`}
            >
              {file.type === "audio"
                ? "Voice message"
                : file.originalName || "File"}
            </p>

            <p
              className={`text-xs mt-1 ${
                isMine
                  ? "text-blue-100"
                  : "text-gray-500 dark:text-gray-300"
              }`}
            >
              {getFileLabel()}

              {file.size
                ? ` • ${formatFileSize(file.size)}`
                : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={downloadAttachment}
            disabled={downloading || checking}
            className={`
              w-10 h-10
              rounded-full
              flex items-center justify-center
              shrink-0
              text-lg
              transition
              ${
                isMine
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500"
              }
              disabled:opacity-60
            `}
            title="Download"
          >
            {downloading ? "⏳" : "⇩"}
          </button>
        </div>
      )}
    </div>
  );
}

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
  onSelect,
  onUnsendPending,
  refreshChatInfo,
  searchQuery,
  isSearchMatch,
  liveLocation,
}) {
    const { user } = useAuth();
    const { socket } = useSocket();

 const senderId =
  typeof message.sender === "object"
    ? message.sender?._id
    : message.sender;

const isMine =
  String(senderId) ===
  String(user?._id);
const [showMenu, setShowMenu] = useState(false);
const touchStartXRef = useRef(null);
const touchCurrentXRef = useRef(null);
const longPressTimerRef = useRef(null);
const longPressTriggeredRef = useRef(false);
const menuButtonRef = useRef(null);
const menuRef = useRef(null);

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

  

  const hasLink =
  message.text &&
  /(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})/i.test(
    message.text
  );

const hasForwardableContent =
  hasLink ||
  message.attachments?.length > 0 ||
  (
    message.location?.latitude != null &&
    message.location?.longitude != null
  ) ||
  Boolean(message.sharedPost);

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

useEffect(() => {
  const handleOutsideClick = (event) => {
    const clickedButton =
      menuButtonRef.current?.contains(event.target);

    const clickedMenu =
      menuRef.current?.contains(event.target);

    if (!clickedButton && !clickedMenu) {
      setShowMenu(false);
    }
  };

  document.addEventListener("mousedown", handleOutsideClick);
  document.addEventListener("touchstart", handleOutsideClick);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
    document.removeEventListener("touchstart", handleOutsideClick);
  };
}, []);

const handleTouchStart = (e) => {
  const x = e.touches[0].clientX;

  touchStartXRef.current = x;
  touchCurrentXRef.current = x;
  longPressTriggeredRef.current = false;

  longPressTimerRef.current = setTimeout(() => {
  longPressTriggeredRef.current = true;

  // Open quick reactions on mobile long press
  setShowEmoji(true);
  setShowMenu(false);

  if (navigator.vibrate) {
    navigator.vibrate(40);
  }
}, 500);
};

const handleTouchMove = (e) => {
  const x = e.touches[0].clientX;

  touchCurrentXRef.current = x;

  const movement = Math.abs(
    x - touchStartXRef.current
  );

  // User swipe करत असेल तर long press cancel
  if (movement > 10) {
    clearTimeout(longPressTimerRef.current);
  }
};

const handleTouchEnd = () => {
  clearTimeout(longPressTimerRef.current);

  // Long press झाला असेल तर swipe-to-reply run करू नको
  if (longPressTriggeredRef.current) {
    longPressTriggeredRef.current = false;

    touchStartXRef.current = null;
    touchCurrentXRef.current = null;

    return;
  }

  if (
    touchStartXRef.current === null ||
    touchCurrentXRef.current === null
  ) {
    return;
  }

  const diff =
    touchCurrentXRef.current -
    touchStartXRef.current;

  const swipeThreshold = 60;

  // My message → LEFT swipe
  if (isMine && diff < -swipeThreshold) {
    onReply(message);
  }

  // Received message → RIGHT swipe
  if (!isMine && diff > swipeThreshold) {
    onReply(message);
  }

  touchStartXRef.current = null;
  touchCurrentXRef.current = null;
};

  return (
    <div
  className={`flex ${
    isMine
      ? "justify-end"
      : "justify-start"
  } ${
    message.reactions?.length > 0
      ? "mb-7"
      : "mb-3"
  }`}
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
      onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  onContextMenu={(e) => {
  e.preventDefault();
  e.stopPropagation();

  setShowMenu(true);
  setShowEmoji(false);
}}
  id={`message-${message._id}`}className={`relative min-w-0 max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow transition-all ${
     isSearchMatch
      ? "ring-4 ring-yellow-400 ring-offset-2"
      : ""
  } ${
    isMine
  ? "bg-blue-600 text-white"
  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
  }`}
>
        

{/* Quick Reaction Button - Desktop */}
{!message.deletedForEveryone && !message.pending && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setShowEmoji((prev) => !prev);
      setShowMenu(false);
    }}
    className={`
  absolute
  top-1/2 -translate-y-1/2

  ${
  hasForwardableContent
    ? isMine
      ? "-left-20"
      : "-right-20"
    : isMine
    ? "-left-10"
    : "-right-10"
}

  hidden md:flex
  w-8 h-8
  items-center justify-center

  rounded-full
  bg-gray-700/90
  text-white
  shadow-md

  opacity-0
  group-hover:opacity-100
  pointer-events-none
  group-hover:pointer-events-auto

  hover:bg-gray-600
  hover:scale-110

  transition-all
  duration-150
  z-50
`}
    title="React"
  >
    <FaSmile size={16} />
  </button>
)}

{/* WhatsApp Style Quick Reaction Bar */}
{showEmoji && (
  <div
    onClick={(e) => e.stopPropagation()}
    className={`
      absolute
      z-[100]

      ${isMine ? "right-0" : "left-0"}
      -top-14

      flex items-center gap-1

      px-2 py-1.5

      bg-white
      dark:bg-gray-800

      border border-gray-200
      dark:border-gray-700

      rounded-full
      shadow-xl

      whitespace-nowrap
    `}
  >
    {emojis.map((emoji) => (
      <button
        type="button"
        key={emoji}
        onClick={() => handleReaction(emoji)}
        className="
          w-9 h-9
          flex items-center justify-center
          text-xl
          rounded-full

          hover:bg-gray-100
          dark:hover:bg-gray-700

          hover:scale-125
          transition-all
        "
      >
        {emoji}
      </button>
    ))}

    <button
      type="button"
      onClick={() => {
        setShowEmoji(false);
        setShowMenu(true);
      }}
      className="
        w-9 h-9
        flex items-center justify-center

        rounded-full

        text-xl
        text-gray-600
        dark:text-gray-200

        hover:bg-gray-100
        dark:hover:bg-gray-700

        transition
      "
      title="More reactions"
    >
      +
    </button>
  </div>
)}

{/* Forward Button - Link / Media / Location / Shared Post */}
{hasForwardableContent &&
  !message.deletedForEveryone &&
  !message.pending && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();

        setShowForward(true);
        setShowMenu(false);
        setShowEmoji(false);
      }}
      className={`
        flex
        absolute
        top-1/2 -translate-y-1/2

        ${isMine ? "-left-10" : "-right-10"}

        w-8 h-8
        items-center justify-center

        rounded-full
        bg-gray-700/90
        text-white
        shadow-md

        hover:bg-gray-600
        hover:scale-110

        transition-all
        z-40
      `}
      title="Forward"
    >
      <FaShare size={14} />
    </button>
)}

{/* Message Menu Arrow */}

  <button
    ref={menuButtonRef}
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setShowMenu((prev) => !prev);
      setShowEmoji(false);
    }}
    className={`
      absolute top-2 right-2
      w-7 h-7
      items-center justify-center
      rounded-full

      bg-white/90 dark:bg-gray-700/90
      text-gray-700 dark:text-gray-200
      shadow-sm

      hidden md:flex
      opacity-0
      group-hover:opacity-100

      hover:bg-white
      dark:hover:bg-gray-600
      transition-all
      z-40
    `}
    title="Message options"
  >
    <FaChevronDown size={13} />
  </button>

  
  {/* =========================
    NORMAL LOCATION
========================= */}

{!message.deletedForEveryone &&
  message.location?.latitude != null &&
  message.location?.longitude != null && (
    <div
      className={`
        mb-2
        w-[280px]
        max-w-full
        overflow-hidden
        rounded-xl
        border

        ${
          isMine
            ? "bg-blue-500 border-blue-400"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        }
      `}
    >
      {/* TOP */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-3">

          {/* ICON */}
          <div
            className={`
              w-10 h-10
              rounded-full
              flex items-center justify-center
              shrink-0

              ${
                isMine
                  ? "bg-white/15"
                  : "bg-blue-500/10"
              }
            `}
          >
            <FaMapMarkerAlt
              size={17}
              className={
                isMine
                  ? "text-white"
                  : "text-blue-500"
              }
            />
          </div>

          {/* INFO */}
          <div className="min-w-0 flex-1">

            <p
              className={`text-sm font-semibold ${
                isMine
                  ? "text-white"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              Location
            </p>

            <p
              className={`text-[11px] mt-1 ${
                isMine
                  ? "text-blue-100"
                  : "text-gray-500 dark:text-gray-300"
              }`}
            >
              {Number(
                message.location.latitude
              ).toFixed(5)}
              ,{" "}
              {Number(
                message.location.longitude
              ).toFixed(5)}
            </p>

          </div>
        </div>
      </div>

      {/* GOOGLE MAPS */}
      <a
        href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`
          w-full
          flex
          items-center
          justify-center
          gap-2

          px-3
          py-2.5

          border-t

          text-xs
          font-semibold

          transition

          ${
            isMine
              ? "border-blue-400 text-white hover:bg-white/10"
              : "border-gray-200 dark:border-gray-700 text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          }
        `}
      >
        <FaMapMarkedAlt size={14} />

        Open in Google Maps

        <FaExternalLinkAlt size={10} />
      </a>
    </div>
)}




{!message.deletedForEveryone &&
  message.sharedPost && (
    <div
      onClick={() =>
        window.location.href =
          `/post/${message.sharedPost._id}/comments`
      }
      className={`
        mb-2
        rounded-xl
        overflow-hidden
        border
        cursor-pointer
        transition
        ${
          isMine
            ? "bg-blue-500 border-blue-400"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        }
      `}
    >
      {/* POST USER */}
      <div className="flex items-center gap-2 p-3">
        <img
          src={
            message.sharedPost.user?.profilePic ||
            "/default-profile-picture.png"
          }
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />

        <div className="min-w-0">
          <p
            className={`text-sm font-semibold truncate ${
              isMine
                ? "text-white"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {message.sharedPost.user?.name}
          </p>

          <p
            className={`text-xs truncate ${
              isMine
                ? "text-blue-100"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            @{message.sharedPost.user?.username}
          </p>
        </div>
      </div>

      {/* POST IMAGE */}
      {message.sharedPost.images?.[0] && (
        <img
          src={message.sharedPost.images[0]}
          alt="Shared post"
          className="
            w-full
            max-h-72
            object-cover
          "
        />
      )}

      {/* CAPTION */}
      {message.sharedPost.description && (
        <div className="px-3 py-2">
          <p
            className={`text-sm line-clamp-2 ${
              isMine
                ? "text-white"
                : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {message.sharedPost.description}
          </p>
        </div>
      )}

      {/* VIEW POST */}
      <div
        className={`
          px-3 py-2
          text-center
          text-sm
          font-semibold
          border-t
          ${
            isMine
              ? "text-white border-blue-400"
              : "text-blue-600 border-gray-200 dark:border-gray-700"
          }
        `}
      >
        View Post
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
  <CachedChatImage
    file={file}
    isMine={isMine}
    onOpen={() => {
      const index = imageAttachments.findIndex(
        (img) => img.url === file.url
      );

      setFullImageIndex(index >= 0 ? index : 0);
      setFullImage(file.url);
    }}
  />
)}

          {/* Video */}
        {file.type === "video" && (
  <CachedAttachment
    file={file}
    isMine={isMine}
  />
)}

          {/* Voice Message */}
         {file.type === "audio" && (
  <CachedAttachment
    file={file}
    isMine={isMine}
  />
)}

          {/* File / PDF / DOC / TXT / ZIP */}
{file.type === "file" && (
  <CachedAttachment
    file={file}
    isMine={isMine}
  />
)}
        </div>
      ))}
    </div>
  )}

{showMenu && (
  <div
    ref={menuRef}
    onClick={(e) => e.stopPropagation()}
    className="
      fixed
      left-1/2 top-1/2
      -translate-x-1/2 -translate-y-1/2
      w-56
      bg-white dark:bg-gray-800
      text-gray-900 dark:text-white
      rounded-xl
      shadow-2xl
      border border-gray-200 dark:border-gray-700
      z-[9999]
      overflow-hidden
      py-1
    "
  >

    {message.pending ? (
  <>
    {/* COPY */}
    {message.text && (
      <button
        type="button"
        onClick={() => {
          handleCopy();
          setShowMenu(false);
        }}
        className="
          w-full flex items-center gap-3
          px-4 py-2.5
          text-left text-sm
          hover:bg-gray-100
          dark:hover:bg-gray-700
        "
      >
        <FaCopy />
        Copy
      </button>
    )}

    {/* UNSEND PENDING MESSAGE */}
    <div className="border-t border-gray-200 dark:border-gray-700 mt-1">
      <button
        type="button"
        onClick={() => {
          setShowMenu(false);
          onUnsendPending?.(message);
        }}
        className="
          w-full flex items-center gap-3
          px-4 py-2.5
          text-left text-sm
          text-red-500
          hover:bg-red-50
          dark:hover:bg-red-950/30
        "
      >
        <FaTrash />
        Unsend
      </button>
    </div>
  </>
) : message.deletedForEveryone ? (

      /* DELETED MESSAGE → ONLY DELETE */
      <button
        type="button"
        onClick={() => {
          setShowMenu(false);
          onSelect(message._id);
        }}
        className="
          w-full
          flex items-center gap-3
          px-4 py-3
          text-left text-sm
          hover:bg-gray-100
          dark:hover:bg-gray-700
        "
      >
        <FaTrash />
        Delete
      </button>

    ) : (
      <>
        {/* इथे तुझे EXISTING menu buttons ठेव */}

        {/* REPLY */}
    <button
      type="button"
      onClick={() => {
        onReply(message);
        setShowMenu(false);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        text-left text-sm
        hover:bg-gray-100
        dark:hover:bg-gray-700
      "
    >
      <FaReply />
      Reply
    </button>

    {/* COPY */}
    {message.text && (
      <button
        type="button"
        onClick={() => {
          handleCopy();
          setShowMenu(false);
        }}
        className="
          w-full flex items-center gap-3
          px-4 py-2.5
          text-left text-sm
          hover:bg-gray-100
          dark:hover:bg-gray-700
        "
      >
        <FaCopy />
        Copy
      </button>
    )}

    {/* REACT */}
    <button
      type="button"
      onClick={() => {
        setShowMenu(false);
        setShowEmoji(true);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        text-left text-sm
        hover:bg-gray-100
        dark:hover:bg-gray-700
      "
    >
      <FaSmile />
      React
    </button>

    {/* FORWARD */}
    <button
      type="button"
      onClick={() => {
        setShowForward(true);
        setShowMenu(false);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        text-left text-sm
        hover:bg-gray-100
        dark:hover:bg-gray-700
      "
    >
      <FaArrowRight />
      Forward
    </button>

    {/* PIN */}
    <button
      type="button"
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
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        text-left text-sm
        hover:bg-gray-100
        dark:hover:bg-gray-700
      "
    >
      📌
      <span>Pin Message</span>
    </button>

    {/* CREATE TASK */}
    <button
      type="button"
      onClick={() => {
        handleCreateTask();
        setShowMenu(false);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        text-left text-sm
        hover:bg-gray-100
        dark:hover:bg-gray-700
      "
    >
      <FaCheck />
      Create Task
    </button>

    {/* STAR */}
    <button
      type="button"
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

          toast.success(
            data.starred
              ? "Message starred"
              : "Message unstarred"
          );
        } catch (err) {
          toast.error("Failed to star message");
        }
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        text-left text-sm
        hover:bg-gray-100
        dark:hover:bg-gray-700
      "
    >
      <span>
        {message.starredBy?.includes(user._id)
          ? "⭐"
          : "☆"}
      </span>

      {message.starredBy?.includes(user._id)
        ? "Unstar Message"
        : "Star Message"}
    </button>

    {/* EDIT - ONLY MY MESSAGE */}
    {isMine && message.text && (
      <button
        type="button"
        onClick={() => {
          setEditing(true);
          setShowMenu(false);
        }}
        className="
          w-full flex items-center gap-3
          px-4 py-2.5
          text-left text-sm
          hover:bg-gray-100
          dark:hover:bg-gray-700
        "
      >
        <FaPen />
        Edit Message
      </button>
    )}

    {/* DELETE */}
    <div className="border-t border-gray-200 dark:border-gray-700 mt-1">

    <button
  type="button"
  onClick={() => {
    setShowMenu(false);
    onSelect(message._id);
  }}
  className="
    w-full flex items-center gap-3
    px-4 py-2.5
    text-left text-sm
    text-red-500
    hover:bg-red-50
    dark:hover:bg-red-950/30
  "
>
  <FaTrash />
  Delete
</button>

    </div>

   </>
    )}

  </div>
)}

{/* {showEmoji && (
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
)} */}


        {/* Reply Preview */}
        {message.replyTo && (
  <div
    onClick={() => {
      const target = document.getElementById(
        `message-${message.replyTo._id}`
      );

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        target.classList.add(
          "ring-4",
          "ring-yellow-400"
        );

        setTimeout(() => {
          target.classList.remove(
            "ring-4",
            "ring-yellow-400"
          );
        }, 1500);
      }
    }}
    className={`mb-3 border-l-4 pl-3 py-2 rounded cursor-pointer ${
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
    className={`text-xs italic mb-1 inline-flex items-center gap-1${
      isMine ? "text-blue-100" : "text-gray-500"
    }`}
  >
    <FaShare/> Forwarded
  </p>
)}

{/* =========================
    CALL MESSAGE / NORMAL MESSAGE
========================= */}

{message.messageType === "call" ? (
  <div
    className={`flex items-center gap-3 min-w-[180px] ${
      message.callType === "missed"
        ? "text-red-500"
        : isMine
        ? "text-white"
        : "text-gray-800 dark:text-white"
    }`}
  >
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        message.callType === "missed"
          ? "bg-red-100 text-red-500"
          : isMine
          ? "bg-white/20"
          : "bg-blue-100 text-blue-600"
      }`}
    >
      {message.callType === "missed" ? "📵" : "📞"}
    </div>

    <div>
      <p className="font-semibold text-sm">
        {message.callType === "missed"
          ? "Missed call"
          : message.callType === "outgoing"
          ? "Outgoing call"
          : "Incoming call"}
      </p>

      {message.callType !== "missed" &&
        message.callDuration > 0 && (
          <p
            className={`text-xs ${
              isMine
                ? "text-blue-100"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {Math.floor(message.callDuration / 60)
              .toString()
              .padStart(2, "0")}
            :
            {(message.callDuration % 60)
              .toString()
              .padStart(2, "0")}
          </p>
        )}
    </div>
  </div>
) : message.deletedForEveryone ? (
  <p className="italic text-gray-300 dark:text-gray-400 inline-flex items-center gap-1">
    <FaBan/> This message was deleted
  </p>
) : editing ? (
  <>
    <input
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
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
  <div
    className={`
      absolute
      -bottom-4
      ${isMine ? "right-2" : "left-2"}
      z-30

      flex items-center
      bg-gray-700 dark:bg-gray-700
      border border-gray-600
      rounded-full
      shadow-md
      px-1.5 py-0.5
    `}
  >
    {message.reactions.map((reaction, index) => (
      <span
        key={index}
        className="text-sm leading-none"
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
  (message.pending ? (
    <span
      title="Pending"
      className="text-blue-100"
    >
      🕒
    </span>
  ) : isSeen ? (
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
