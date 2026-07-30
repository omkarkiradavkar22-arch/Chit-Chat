import { useAuth } from "../../context/AuthContext";
import {
  FaCheck,
  FaCheckDouble,
  FaReply,
  FaEllipsisV,
  FaEdit,
  FaCopy,
  FaSmile,
} from "react-icons/fa";
import { useState, useRef } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import ForwardModal from "./ForwardModal";
import { FaPlay, FaPause } from "react-icons/fa";

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
      className={`flex items-center gap-3 rounded-full px-3 py-2 min-w-[210px] ${
        isMine ? "bg-blue-500" : "bg-gray-100"
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
          isMine ? "text-blue-100" : "text-gray-500"
        }`}
      >
        {formatTime(currentTime > 0 ? currentTime : duration)}
      </span>
    </div>
  );
}

function MessageBubble({
  message,
  onReply,
  onDelete,
  onEdit,
  onReaction,
  refreshChatInfo,
}) {
    const { user } = useAuth();

  const isMine = message.sender?._id === user?._id;
const [showMenu, setShowMenu] = useState(false);
const [editing, setEditing] = useState(false);
const [editedText, setEditedText] = useState(message.text);
const emojis = ["❤️", "😂", "👍", "🔥", "😮", "😢"];
  const isSeen =
    message.seenBy &&
    message.seenBy.length > 1;

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


  return (
    <div
      className={`flex ${
        isMine
          ? "justify-end"
          : "justify-start"
      } mb-3`}
    >
      <div
        className={`relative group max-w-[70%] rounded-2xl px-4 py-3 shadow ${
          isMine
            ? "bg-blue-600 text-white"
            : "bg-white"
        }`}
      >
        
        {/* Reply Button */}
<button
  onClick={() => onReply(message)}
  className="absolute -bottom-2 -right-2 hidden group-hover:flex bg-white text-gray-700 p-2 rounded-full shadow"
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
              className="rounded-xl max-h-72 max-w-full object-cover"
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
              rel="noreferrer"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                isMine
                  ? "bg-blue-500 hover:bg-blue-400"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <span className="text-2xl">📄</span>

              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {file.originalName || "File"}
                </p>

                {file.size && (
                  <p className="text-xs opacity-70">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </a>
          )}

        </div>
      ))}
    </div>
  )}

{showMenu && (
  <div className="absolute top-8 right-2 bg-white rounded-lg shadow-lg border w-44 z-50">

    <button
      onClick={handleDeleteForMe}
      className="w-full text-left px-4 py-2 hover:bg-gray-100"
    >
      🗑 Delete for Me
    </button>

    <button
onClick={()=>{
handleCopy();
setShowMenu(false);
}}
className="w-full text-left px-4 py-2 hover:bg-gray-100"
>
📋 Copy
</button>

<button
  onClick={() => {
    setShowForward(true);
    setShowMenu(false);
  }}
  className="w-full text-left px-4 py-2 hover:bg-gray-100"
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
  className="w-full text-left px-4 py-2 hover:bg-gray-100"
>
  📌 Pin Message
</button>

    {isMine && (
      <button
        onClick={handleDeleteForEveryone}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
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
className="w-full text-left px-4 py-2 hover:bg-gray-100"
>
✏️ Edit Message
</button>
)}

<button
  onClick={() => {
  setShowEmoji(!showEmoji);
  setShowMenu(false);
}}
  className="w-full text-left px-4 py-2 hover:bg-gray-100"
>
  ❤️ React
</button>

  </div>
)}

{showEmoji && (
  <div className="absolute top-10 left-0 bg-white shadow rounded-lg flex p-2 gap-2 z-50">
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
                ? "border-blue-200 bg-blue-500"
                : "border-gray-400 bg-gray-100"
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
  <p className="italic text-gray-300">
    🚫 This message was deleted
  </p>
) : editing ? (
  <>
    <input
      value={editedText}
      onChange={(e) =>
        setEditedText(e.target.value)
      }
      className="border rounded px-2 py-1 w-full text-black"
    />

    <button
      onClick={handleEdit}
      className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded"
    >
      Save
    </button>
  </>
) : (
  <p>{message.text}</p>
)}

{message.reactions?.length > 0 && (
  <div className="flex gap-1 mt-2 flex-wrap">
    {message.reactions.map((reaction, index) => (
      <span
        key={index}
        className="bg-white px-2 rounded-full text-sm shadow"
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
            <ForwardModal
  open={showForward}
  onClose={() => setShowForward(false)}
  messageId={message._id}
/>
    </div>
  );
}

export default MessageBubble;
