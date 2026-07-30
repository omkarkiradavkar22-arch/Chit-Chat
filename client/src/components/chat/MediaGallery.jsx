import { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState("photos");
  const [gallery, setGallery] = useState({
    photos: [],
    videos: [],
    files: [],
    links: [],
  });
  const [loading, setLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    if (!isOpen || !chatId) return;

    const fetchGallery = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/messages/${chatId}/media`);
        if (data.success) {
          setGallery(data.gallery);
        }
      } catch (err) {
        console.error("Failed to load media gallery:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [isOpen, chatId]);

  if (!isOpen) return null;

  const items = gallery[activeTab] || [];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-lg">
              Media, Links &amp; Docs
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon} {tab.label}
                {gallery[tab.key]?.length > 0 && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({gallery[tab.key].length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <p className="text-center text-gray-400 py-10">
                Loading...
              </p>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-400 py-10">
                No {activeTab} shared yet
              </p>
            ) : activeTab === "photos" ? (
              <div className="grid grid-cols-3 gap-2">
                {items.map((item, i) => (
                  <img
                    key={item.messageId || i}
                    src={item.url}
                    onClick={() => setLightboxUrl(item.url)}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                    alt=""
                  />
                ))}
              </div>
            ) : activeTab === "videos" ? (
              <div className="grid grid-cols-2 gap-2">
                {items.map((item, i) => (
                  <video
                    key={item.messageId || i}
                    src={item.url}
                    controls
                    className="w-full rounded-lg bg-black aspect-video"
                  />
                ))}
              </div>
            ) : activeTab === "files" ? (
              <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <a
                    key={item.messageId || i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={item.originalName}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FaFileAlt size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {item.originalName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatBytes(item.size)}
                      </p>
                    </div>
                    <FaDownload
                      size={14}
                      className="text-gray-400 shrink-0"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item, i) => {
                  let domain = item.url;
                  try {
                    domain = new URL(item.url).hostname.replace(
                      "www.",
                      ""
                    );
                  } catch {
                    // keep raw url as fallback label
                  }
                  return (
                    <a
                      key={item.messageId || i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                        <FaExternalLinkAlt size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-blue-600">
                          {item.url}
                        </p>
                        <p className="text-xs text-gray-400">
                          {domain}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for photo preview */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            className="max-w-full max-h-full rounded-lg"
            alt=""
          />
        </div>
      )}
    </>
  );
}

export default MediaGallery;
