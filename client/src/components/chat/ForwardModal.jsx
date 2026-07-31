import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";

function ForwardModal({
  open,
  onClose,
  messageId,
}) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] =
    useState("");

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

  const handleForward = async () => {
    if (!selectedChat) {
      return toast.error("Select a chat");
    }

    try {
      await api.post(
        `/messages/${messageId}/forward`,
        {
          chatId: selectedChat,
        }
      );

      toast.success("Message forwarded");

      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to forward"
      );
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">

      <div className="bg-white rounded-xl w-[380px] p-5">

        <h2 className="text-xl font-bold mb-4">
          Forward Message
        </h2>

        <div className="space-y-2 max-h-80 overflow-y-auto">

          {chats.map((chat) => (
            <label
              key={chat._id}
              className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-100"
            >
              <input
                type="radio"
                checked={
                  selectedChat === chat._id
                }
                onChange={() =>
                  setSelectedChat(chat._id)
                }
              />

              <img
                src={
                  chat.otherUser?.profilePic
                }
                className="w-10 h-10 rounded-full object-cover"
              />

              <span>
                {chat.otherUser?.name}
              </span>

            </label>
          ))}

        </div>

        <div className="flex justify-end gap-3 mt-5">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded border"
          >
            Cancel
          </button>

          <button
            onClick={handleForward}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Forward
          </button>

        </div>

      </div>

    </div>
  );
}

export default ForwardModal;