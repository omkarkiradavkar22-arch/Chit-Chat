import { Link, useParams } from "react-router-dom";

function ChatSidebar({ chats, loading ,onlineUsers}) {
  const { chatId } = useParams();

  if (loading) {
    return (
      <div className="w-80 bg-white border-r flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r h-full overflow-y-auto">

      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold">
          Messages
        </h2>
      </div>

      {chats.length === 0 ? (
        <div className="p-5 text-gray-500">
          No chats yet.
        </div>
      ) : (
        chats.map((chat) => (
          <Link
            key={chat._id}
            to={`/chat/${chat._id}`}
            className={`flex items-center gap-3 p-4 hover:bg-gray-100 transition ${
              chatId === chat._id ? "bg-gray-100" : ""
            }`}
          >
            <img
              src={
                chat.otherUser?.profilePic ||
                "https://placehold.co/100x100?text=User"
              }
              alt={chat.otherUser?.name}
              className="w-12 h-12 rounded-full object-cover"
            />

            {onlineUsers.includes(chat.otherUser?._id) && (
    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
  )}

            <div className="flex-1 overflow-hidden">

              <h3 className="font-semibold truncate">
                {chat.otherUser?.name}
              </h3>

              <p className="text-sm text-gray-500 truncate">
                {chat.lastMessage?.text || "No messages yet"}
              </p>

            </div>

            {chat.unreadCount > 0 && (
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {chat.unreadCount}
              </div>
            )}

          </Link>
        ))
      )}

    </div>
  );
}

export default ChatSidebar;