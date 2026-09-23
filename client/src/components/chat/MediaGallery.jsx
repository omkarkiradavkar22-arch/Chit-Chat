import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import {
  FaTimes,
  FaFileAlt,
  FaDownload,
  FaExternalLinkAlt,
  FaImages,
  FaVideo,
  FaRegFileVideo,
FaLink,
FaChevronLeft,
FaChevronRight,
FaPlay,

} from "react-icons/fa";

const TABS = [
  { key: "photos", label: "Photos", icon: <FaImages/> },
  { key: "videos", label: "Videos", icon: <FaVideo/> },
  { key: "files", label: "Files", icon: <FaRegFileVideo/> },
  { key: "links", label: "Links", icon: <FaLink/> },
];

function formatBytes(bytes) {
  if (!bytes) return "";

  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;

  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

async function downloadFileToDevice(item) {
  if (!navigator.onLine) {
    alert("Connect to internet to download this file");
    return;
  }

  try {
    const response = await fetch(item.url);

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = item.originalName || "attachment";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  } catch (error) {
    console.error("Media gallery download error:", error);
    alert("Failed to download file");
  }
}

function MediaGallery({ chatId, isOpen, onClose }) {
  const { theme } = useTheme();
const darkMode = theme === "dark";

  const [activeTab, setActiveTab] = useState("photos");

  const [gallery, setGallery] = useState({
    photos: [],
    videos: [],
    files: [],
    links: [],
  });

  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
const [viewerType, setViewerType] = useState(null);
const [viewerIndex, setViewerIndex] = useState(0);

const touchStartXRef = useRef(null);
const touchEndXRef = useRef(null);

  // =========================
  // FETCH MEDIA
  // =========================
  useEffect(() => {
    if (!isOpen || !chatId) return;

    const fetchGallery = async () => {
      setLoading(true);

      try {
        const { data } = await api.get(`/messages/${chatId}/media`);

        console.log("MEDIA GALLERY RESPONSE:", data.gallery);

        if (data.success) {
          setGallery({
            photos: data.gallery?.photos || [],
            videos: data.gallery?.videos || [],
            files: data.gallery?.files || [],
            links: data.gallery?.links || [],
          });
        }
      } catch (err) {
        console.error("Failed to load media gallery:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [isOpen, chatId]);

  const openMediaViewer = (type, index) => {
  setViewerType(type);
  setViewerIndex(index);
  setViewerOpen(true);
};

const closeMediaViewer = () => {
  setViewerOpen(false);
  setViewerType(null);
  setViewerIndex(0);

  touchStartXRef.current = null;
  touchEndXRef.current = null;
};

const getViewerItems = () => {
  if (viewerType === "photo") {
    return gallery.photos || [];
  }

  if (viewerType === "video") {
    return gallery.videos || [];
  }

  return [];
};

const showNextMedia = () => {
  const viewerItems = getViewerItems();

  if (viewerItems.length <= 1) return;

  setViewerIndex((prev) =>
    prev === viewerItems.length - 1
      ? 0
      : prev + 1
  );
};

const showPreviousMedia = () => {
  const viewerItems = getViewerItems();

  if (viewerItems.length <= 1) return;

  setViewerIndex((prev) =>
    prev === 0
      ? viewerItems.length - 1
      : prev - 1
  );
};


// =========================
// MOBILE SWIPE
// =========================

const handleViewerTouchStart = (e) => {
  touchStartXRef.current =
    e.touches[0].clientX;

  touchEndXRef.current = null;
};

const handleViewerTouchMove = (e) => {
  touchEndXRef.current =
    e.touches[0].clientX;
};

const handleViewerTouchEnd = () => {
  if (
    touchStartXRef.current === null ||
    touchEndXRef.current === null
  ) {
    return;
  }

  const diff =
    touchStartXRef.current -
    touchEndXRef.current;

  // Small accidental movements ignore
  if (Math.abs(diff) < 50) {
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    return;
  }

  // Swipe LEFT → Next
  if (diff > 0) {
    showNextMedia();
  }

  // Swipe RIGHT → Previous
  if (diff < 0) {
    showPreviousMedia();
  }

  touchStartXRef.current = null;
  touchEndXRef.current = null;
};

  // =========================
// CLOSE LIGHTBOX WHEN TAB CHANGES
// =========================
useEffect(() => {
  setViewerOpen(false);
  setViewerType(null);
  setViewerIndex(0);
}, [activeTab]);

// =========================
// CONDITIONAL RETURN
// =========================
if (!isOpen) return null;

const items = gallery[activeTab] || [];

console.log("ACTIVE TAB:", activeTab);
console.log("ITEMS:", items);

 

  return (
    <>
      {/* =====================================================
          MAIN MODAL
      ===================================================== */}
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

        <div
          className={`w-full max-w-xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${
            darkMode
              ? "bg-[#111827] border-gray-700 text-white"
              : "bg-white border-gray-200 text-gray-900"
          }`}
        >

          {/* =====================================================
              HEADER
          ===================================================== */}
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${
              darkMode
                ? "bg-[#172235] border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >

            <div>
              <h3 className="font-semibold text-lg">
                Media, Links & Docs
              </h3>

              <p
                className={`text-xs mt-0.5 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Shared content from this chat
              </p>
            </div>

            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <FaTimes size={15} />
            </button>

          </div>

          {/* =====================================================
              TABS
          ===================================================== */}
          <div
            className={`flex border-b ${
              darkMode
                ? "bg-[#111827] border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >

            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = gallery[tab.key]?.length || 0;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex-1 py-3 text-sm font-medium transition ${
                    isActive
                      ? "text-blue-400"
                      : darkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >

                  <span className="flex items-center justify-center gap-1.5">

                    <span>{tab.icon}</span>

                    <span>{tab.label}</span>

                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-blue-500/20 text-blue-300"
                            : darkMode
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}

                  </span>

                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
                  )}

                </button>
              );
            })}

          </div>

          {/* =====================================================
              CONTENT
          ===================================================== */}
          <div
            className={`flex-1 overflow-y-auto p-4 ${
              darkMode ? "bg-[#0f172a]" : "bg-gray-50"
            }`}
          >

            {/* =========================
                LOADING
            ========================= */}
            {loading ? (

              <div className="flex flex-col items-center justify-center py-16">

                <div className="w-9 h-9 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />

                <p
                  className={`text-sm mt-4 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Loading shared content...
                </p>

              </div>

            ) : items.length === 0 ? (

              /* =========================
                  EMPTY STATE
              ========================= */
              <div className="flex flex-col items-center justify-center py-16">

                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 ${
                    darkMode ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  {TABS.find((t) => t.key === activeTab)?.icon}
                </div>

                <p
                  className={`font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  No {activeTab} shared yet
                </p>

                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Shared {activeTab} will appear here
                </p>

              </div>

            ) : activeTab === "photos" ? (

              /* =====================================================
                  PHOTOS
              ===================================================== */
              <div className="grid grid-cols-3 gap-2">

                {items.map((item, i) => (

                  <div
                    key={`${item.messageId}-${item.url}-${i}`}
                    onClick={() =>
  openMediaViewer("photo", i)
}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group ${
                      darkMode ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  >

                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />

                  </div>

                ))}

              </div>

            ) : activeTab === "videos" ? (

              /* =====================================================
                  VIDEOS
              ===================================================== */
              <div className="grid grid-cols-2 gap-3">

                {items.map((item, i) => (

                  <div
  key={`${item.messageId}-${item.url}-${i}`}
  onClick={() =>
    openMediaViewer("video", i)
  }
  className={`relative rounded-xl overflow-hidden border cursor-pointer group ${
    darkMode
      ? "bg-black border-gray-700"
      : "bg-gray-100 border-gray-200"
  }`}
>
  <video
    src={item.url}
    muted
    preload="metadata"
    className="w-full aspect-video object-cover"
  />

  <div
    className="
      absolute inset-0
      flex items-center justify-center
      bg-black/20
      group-hover:bg-black/30
      transition
    "
  >
   <div
  className="
    w-12 h-12
    rounded-full
    bg-black/60
    text-white
    flex items-center justify-center
  "
>
  <FaPlay size={17} className="ml-0.5" />
</div>
  </div>
</div>

                ))}

              </div>

            ) : activeTab === "files" ? (

              /* =====================================================
                  FILES
              ===================================================== */
              <div className="flex flex-col gap-2">

                {items.map((item, i) => (

                 <div
  key={`${item.messageId}-${item.url}-${i}`}
  className={`group flex items-center gap-3 p-3 rounded-xl border transition ${
    darkMode
      ? "bg-[#172235] border-gray-700 hover:border-blue-500/60 hover:bg-[#1c2a40]"
      : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50"
  }`}
>

                    <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                      <FaFileAlt size={18} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p
                        className={`text-sm font-medium truncate ${
                          darkMode
                            ? "text-gray-200 group-hover:text-blue-300"
                            : "text-gray-800 group-hover:text-blue-600"
                        }`}
                      >
                        {item.originalName || "File"}
                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {formatBytes(item.size)}
                      </p>

                    </div>

                    <button
  type="button"
  onClick={() => downloadFileToDevice(item)}
  className={`
    w-9 h-9
    rounded-full
    flex items-center justify-center
    shrink-0
    transition
    ${
      darkMode
        ? "text-gray-400 hover:text-blue-400 hover:bg-gray-700"
        : "text-gray-500 hover:text-blue-600 hover:bg-blue-100"
    }
  `}
  title="Download"
>
  <FaDownload size={14} />
</button>

                  </div>

                ))}

              </div>

            ) : (

              /* =====================================================
                  LINKS
              ===================================================== */
              <div className="flex flex-col gap-2">

                {items.map((item, i) => {

                  let domain = item.url;

                  try {
                    domain = new URL(item.url)
                      .hostname
                      .replace("www.", "");
                  } catch {
                    // fallback
                  }

                  return (
                    <a
                      key={`${item.messageId}-${item.url}-${i}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex items-center gap-3 p-3 rounded-xl border transition ${
                        darkMode
                          ? "bg-[#172235] border-gray-700 hover:border-blue-500/60 hover:bg-[#1c2a40]"
                          : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >

                      <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                        <FaExternalLinkAlt size={15} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-medium truncate text-blue-400 group-hover:text-blue-500">
                          {item.url}
                        </p>

                        <p
                          className={`text-xs mt-1 ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {domain}
                        </p>

                      </div>

                      <FaExternalLinkAlt
                        size={13}
                        className={`transition shrink-0 ${
                          darkMode
                            ? "text-gray-600 group-hover:text-blue-400"
                            : "text-gray-400 group-hover:text-blue-500"
                        }`}
                      />

                    </a>
                  );
                })}

              </div>
            )}

          </div>

        </div>

      </div>

      {/* =====================================================
    PHOTO / VIDEO MEDIA VIEWER
===================================================== */}

{viewerOpen && (() => {
  const viewerItems = getViewerItems();
  const currentItem = viewerItems[viewerIndex];

  if (!currentItem) return null;

  return (
    <div
      className="
        fixed inset-0
        z-[10000]
        bg-black/95
        backdrop-blur-sm
        flex flex-col
      "
      onClick={closeMediaViewer}
    >

      {/* =========================
          TOP BAR
      ========================= */}
      <div
        className="
          h-16
          px-4 sm:px-6
          flex items-center justify-between
          text-white
          shrink-0
        "
        onClick={(e) => e.stopPropagation()}
      >

        <div>
          <p className="font-semibold">
            {viewerType === "photo"
              ? "Photos"
              : "Videos"}
          </p>

          <p className="text-xs text-gray-400 mt-0.5">
            {viewerIndex + 1} of {viewerItems.length}
          </p>
        </div>


        <div className="flex items-center gap-2">

          {/* DOWNLOAD */}
          <button
            type="button"
            onClick={() =>
              downloadFileToDevice(currentItem)
            }
            className="
              w-10 h-10
              rounded-full
              flex items-center justify-center
              hover:bg-white/10
              transition
            "
            title="Download"
          >
            <FaDownload size={18} />
          </button>


          {/* CLOSE */}
          <button
            type="button"
            onClick={closeMediaViewer}
            className="
              w-10 h-10
              rounded-full
              flex items-center justify-center
              hover:bg-white/10
              transition
            "
            title="Close"
          >
            <FaTimes size={20} />
          </button>

        </div>
      </div>


      {/* =========================
          MAIN VIEWER
      ========================= */}
      <div
        className="
          relative
          flex-1
          min-h-0
          flex items-center justify-center
          px-2 sm:px-20
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleViewerTouchStart}
        onTouchMove={handleViewerTouchMove}
        onTouchEnd={handleViewerTouchEnd}
      >

        {/* PREVIOUS */}
        {viewerItems.length > 1 && (
          <button
            type="button"
            onClick={showPreviousMedia}
            className="
              absolute
              left-2 sm:left-6
              z-20
              w-11 h-11
              sm:w-14 sm:h-14
              rounded-full
              bg-black/50
              hover:bg-black/70
              text-white
              flex items-center justify-center
              transition
            "
            title="Previous"
          >
            <FaChevronLeft size={24} />
          </button>
        )}


        {/* PHOTO */}
        {viewerType === "photo" && (
          <img
            key={currentItem.url}
            src={currentItem.url}
            alt=""
            draggable="false"
            className="
              max-w-full
              max-h-full
              object-contain
              rounded-lg
              select-none
            "
          />
        )}


        {/* VIDEO */}
        {viewerType === "video" && (
          <video
            key={currentItem.url}
            src={currentItem.url}
            controls
            autoPlay
            playsInline
            className="
              max-w-full
              max-h-full
              object-contain
              rounded-lg
              bg-black
            "
          />
        )}


        {/* NEXT */}
        {viewerItems.length > 1 && (
          <button
            type="button"
            onClick={showNextMedia}
            className="
              absolute
              right-2 sm:right-6
              z-20
              w-11 h-11
              sm:w-14 sm:h-14
              rounded-full
              bg-black/50
              hover:bg-black/70
              text-white
              flex items-center justify-center
              transition
            "
            title="Next"
          >
            <FaChevronRight size={24} />
          </button>
        )}

      </div>


      {/* =========================
          THUMBNAILS
      ========================= */}

      {viewerItems.length > 1 && (
        <div
          className="
            h-24
            sm:h-28
            shrink-0
            flex items-center justify-center
            px-4
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="
              flex items-center gap-2
              max-w-full
              overflow-x-auto
              px-2 py-2
            "
          >
            {viewerItems.map((item, index) => (
              <button
                key={`${item.messageId}-${item.url}-${index}`}
                type="button"
                onClick={() =>
                  setViewerIndex(index)
                }
                className={`relative
                  w-14 h-14
                  sm:w-16 sm:h-16
                  shrink-0
                  rounded-lg
                  overflow-hidden
                  border-2
                  transition
                  ${
                    index === viewerIndex
                      ? "border-blue-500"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }
                `}
              >

                {viewerType === "photo" ? (
                  <img
                    src={item.url}
                    alt=""
                    className="
                      w-full h-full
                      object-cover
                    "
                  />
                ) : (
                  <>
                    <video
                      src={item.url}
                      muted
                      preload="metadata"
                      className="
                        w-full h-full
                        object-cover
                      "
                    />

                    <div
                      className="
                        absolute inset-0
                        flex items-center justify-center
                        text-white
                        bg-black/20
                      "
                    >
                      ▶
                    </div>
                  </>
                )}

              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
})()}

    </>
  );
}

export default MediaGallery;
