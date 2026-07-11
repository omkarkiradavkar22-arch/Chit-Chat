import { useRef, useState } from "react";
import { FaImage, FaPaperPlane } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import EmojiPicker from "emoji-picker-react";
import { FaSmile } from "react-icons/fa";

function MessageInput({
  chatId,
  receiverId,
  senderId,
  replyMessage,
  setReplyMessage,
  onMessageSent,
}) {
  const fileInputRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  const typingTimeout = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleEmojiClick = (emojiData) => {
  setText((prev) => prev + emojiData.emoji);
};

  const sendMessage = async () => {
    if (!text.trim() && !image) {
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("text", text);
      if (replyMessage) {
  formData.append("replyTo", replyMessage._id);
}

      if (image) {
        formData.append("image", image);
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

      setText("");
setImage(null);
setPreview("");
setReplyMessage(null);

      if (onMessageSent) {
        onMessageSent(data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send message"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="border-t bg-white p-4">

      {replyMessage && (
  <div className="mb-3 p-3 rounded-xl bg-gray-100 border-l-4 border-blue-600 flex justify-between items-center">
    <div>
      <p className="font-semibold text-sm">
        Replying to {replyMessage.sender?.name}
      </p>

      <p className="text-sm text-gray-600 truncate">
        {replyMessage.text || "📷 Photo"}
      </p>
    </div>

    <button
      onClick={() => setReplyMessage(null)}
      className="text-red-500"
    >
      ✕
    </button>
  </div>
)}

      {preview && (
        <div className="mb-3">
          <img
            src={preview}
            alt="Preview"
            className="w-32 rounded-xl"
          />
        </div>
      )}

      <div className="flex items-center gap-3">

       <button
  type="button"
  onClick={() => fileInputRef.current.click()}
  className="text-blue-600 text-xl"
>
  <FaImage />
</button>

<button
  type="button"
  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
  className="text-yellow-500 text-xl"
>
  <FaSmile />
</button>

{showEmojiPicker && (
  <div className="absolute bottom-20 left-4 z-50">
    <EmojiPicker onEmojiClick={handleEmojiClick} />
  </div>
)}
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="image/*"
          onChange={handleImage}
        />

        <textarea
          rows={1}
          value={text}
         onChange={(e) => {
  setText(e.target.value);

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
}}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 border rounded-xl p-3 resize-none outline-none"
        />

        <button
          disabled={loading}
          onClick={sendMessage}
          className="bg-blue-600 text-white p-3 rounded-full"
        >
          <FaPaperPlane />
        </button>

      </div>

    </div>
  );
}

export default MessageInput;