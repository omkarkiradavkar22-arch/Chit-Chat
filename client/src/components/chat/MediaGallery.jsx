import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  FaTimes,
  FaFileAlt,
  FaDownload,
  FaExternalLinkAlt,
} from "react-icons/fa";

const TABS = [
  { key: "photos", label: "Photos", icon: "🖼️" },
  { key: "videos", label: "Videos", icon: "🎥" },
  { key: "files", label: "Files", icon: "📄" },
  { key: "links", label: "Links", icon: "🔗" },
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

function MediaGallery({ chatId, isOpen, onClose }) {
  const { darkMode } = useAuth();

  const [activeTab, setActiveTab] = useState("photos");

  const [gallery, setGallery] = useState({
    photos: [],
    videos: [],
    files: [],
    links: [],
  });

  const [loading, setLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

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


  // =========================
// CLOSE LIGHTBOX WHEN TAB CHANGES
// =========================
useEffect(() => {
  setLightboxUrl(null);
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
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

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
                    onClick={() => setLightboxUrl(item.url)}
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
                    className={`relative rounded-xl overflow-hidden border ${
                      darkMode
                        ? "bg-black border-gray-700"
                        : "bg-gray-100 border-gray-200"
                    }`}
                  >

                    <video
                      src={item.url}
                      controls
                      className="w-full aspect-video object-cover"
                    />

                  </div>

                ))}

              </div>

            ) : activeTab === "files" ? (

              /* =====================================================
                  FILES
              ===================================================== */
              <div className="flex flex-col gap-2">

                {items.map((item, i) => (

                  <a
                    key={`${item.messageId}-${item.url}-${i}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={item.originalName}
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

                    <FaDownload
                      size={14}
                      className="text-gray-500 group-hover:text-blue-400 transition shrink-0"
                    />

                  </a>

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
          PHOTO LIGHTBOX
      ===================================================== */}
      {lightboxUrl && (

        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setLightboxUrl(null)}
        >

          {/* CLOSE BUTTON */}
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <FaTimes />
          </button>

          {/* FULL PHOTO */}
          <img
            src={lightboxUrl}
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            alt=""
            onClick={(e) => e.stopPropagation()}
          />

        </div>

      )}

    </>
  );
}

export default MediaGallery;