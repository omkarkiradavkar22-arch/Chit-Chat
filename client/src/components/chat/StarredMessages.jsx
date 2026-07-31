import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { FaTimes, FaStar, FaSearch } from "react-icons/fa";

function previewText(msg) {
  if (msg.text) return msg.text;
  const type = msg.attachments?.[0]?.type;
  if (type === "image") return "📷 Photo";
  if (type === "video") return "🎥 Video";
  if (type === "audio") return "🎤 Voice message";
  if (type === "file") return "📄 File";
  return "Message";
}

function StarredMessages({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchStarred = async (query = "") => {
    setLoading(true);
    try {
      const { data } = await api.get("/messages/starred", {
        params: query ? { search: query } : {},
      });
      if (data.success) setMessages(data.messages);
    } catch (err) {
      console.error("Failed to load starred messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    fetchStarred();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => fetchStarred(search), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  if (!isOpen) return null;

  const unstar = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/star`);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error("Failed to unstar:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FaStar className="text-yellow-500" size={16} />
            Starred Messages
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={13}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search starred messages..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-gray-400 py-10">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 py-10">
              {search
                ? "No matching starred messages"
                : "No starred messages yet"}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => {
                    navigate(`/chat/${msg.chat?._id || msg.chat}`);
                    onClose();
                  }}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition cursor-pointer"
                >
                  <img
                    src={
                      msg.sender?.profilePic ||
                      "https://placehold.co/100x100?text=User"
                    }
                    alt={msg.sender?.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {msg.sender?.name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {previewText(msg)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(msg.createdAt).toLocaleString([], {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      unstar(msg._id);
                    }}
                    title="Unstar"
                    className="text-yellow-500 shrink-0 hover:text-yellow-600"
                  >
                    <FaStar size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StarredMessages;