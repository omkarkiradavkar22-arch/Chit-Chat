import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";

function ForwardModal({
  open,
  onClose,
  messageId,
}) {
  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);

  const { theme } = useTheme();

  useEffect(() => {
    if (!open) return;

    const loadChats = async () => {
      try {
        const { data } = await api.get("/chat");

        setChats(data.chats);
      } catch (err) {
        toast.error("Failed to load chats");
      }
    };

    loadChats();
  }, [open]);

  // Select / unselect multiple chats
  const toggleChat = (chatId) => {
    setSelectedChats((prev) => {
      if (prev.includes(chatId)) {
        return prev.filter((id) => id !== chatId);
      }
      return [...prev, chatId];
    });
  };

  const handleForward = async () => {
    if (selectedChats.length === 0) {
      return toast.error("Select at least one chat");
    }

    try {
      const { data } = await api.post(
        `/messages/${messageId}/forward`,
        {
          chatIds: selectedChats,
        }
      );

      toast.success(
        `Message forwarded to ${selectedChats.length} chat${
          selectedChats.length > 1 ? "s" : ""
        }`
      );

      setSelectedChats([]);
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to forward"
      );
    }
  };

  const handleClose = () => {
    setSelectedChats([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0
        bg-black/40 dark:bg-black/70
        flex items-center justify-center
        z-[999]
        p-4
      "
    >
      <div
        className="
          bg-white dark:bg-gray-900
          text-gray-900 dark:text-white
          rounded-xl
          w-full max-w-[380px]
          p-5
          shadow-xl
          border border-gray-200 dark:border-gray-700
          transition-colors
        "
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            Forward Message
          </h2>

          {selectedChats.length > 0 && (
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {selectedChats.length} selected
            </span>
          )}
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {chats.map((chat) => {
            const isSelected = selectedChats.includes(
              chat._id
            );

            return (
              <label
                key={chat._id}
                className={`
                  flex items-center gap-3
                  cursor-pointer
                  p-2
                  rounded-xl
                  transition-colors
                  ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() =>
                    toggleChat(chat._id)
                  }
                  className="
                    w-4 h-4
                    accent-blue-600
                    cursor-pointer
                  "
                />

                <img
                  src={
                    chat.otherUser?.profilePic ||
                    "/default-profile-picture.png"
                  }
                  alt={
                    chat.otherUser?.name || "User"
                  }
                  className="
                    w-10 h-10
                    rounded-full
                    object-cover
                  "
                />

                <span className="text-gray-900 dark:text-gray-100">
                  {chat.otherUser?.name}
                </span>
              </label>
            );
          })}

          {chats.length === 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-5">
              No chats available
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={handleClose}
            className="
              px-4 py-2
              rounded-lg
              border
              border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100
              dark:hover:bg-gray-800
              transition
            "
          >
            Cancel
          </button>

          <button
            onClick={handleForward}
            disabled={selectedChats.length === 0}
            className="
              px-4 py-2
              rounded-lg
              bg-blue-600
              hover:bg-blue-700
              text-white
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {selectedChats.length > 0
              ? `Forward (${selectedChats.length})`
              : "Forward"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForwardModal;
