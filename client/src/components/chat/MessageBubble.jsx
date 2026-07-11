import { useAuth } from "../../context/AuthContext";
import {
  FaCheck,
  FaCheckDouble,
  FaReply,
} from "react-icons/fa";

function MessageBubble({ message, onReply }) {
  const { user } = useAuth();

  const isMine = message.sender?._id === user?._id;

  const isSeen =
    message.seenBy &&
    message.seenBy.length > 1;

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
          className="absolute -top-2 -right-2 hidden group-hover:flex bg-white text-gray-700 p-2 rounded-full shadow"
        >
          <FaReply size={12} />
        </button>

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

            {message.replyTo.image?.url && (
              <p className="text-sm italic">
                📷 Photo
              </p>
            )}
          </div>
        )}

        {/* Image */}
        {message.image?.url && (
          <img
            src={message.image.url}
            alt="Message"
            className="rounded-xl mb-2 max-h-72 object-cover"
          />
        )}

        {/* Text */}
        {message.text && (
          <p>{message.text}</p>
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

          <button
  onClick={() => onReply(message)}
  className="text-xs underline"
>
  Reply
</button>

          {isMine &&
            (isSeen ? (
              <FaCheckDouble className="text-blue-200" />
            ) : (
              <FaCheck />
            ))}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;