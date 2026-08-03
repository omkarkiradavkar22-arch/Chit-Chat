import api from "../../services/api";
import { Link, useParams } from "react-router-dom";
import { FaStar, FaTasks } from "react-icons/fa";
import StarredMessages from "./StarredMessages";
import { useState, useEffect } from "react";
import Tasks from "./Tasks";

function ChatSidebar({ chats, loading ,onlineUsers}) {
  const { chatId } = useParams();
  const [showStarred, setShowStarred] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
const [pendingTaskCount, setPendingTaskCount] = useState(0);

useEffect(() => {
  const fetchPendingTasks = async () => {
    try {
      const { data } = await api.get("/tasks");

      if (data.success) {
        const pendingCount = (data.tasks || []).filter(
          (task) => !task.completed
        ).length;

        setPendingTaskCount(pendingCount);
      }
    } catch (error) {
      console.error("Failed to fetch pending tasks:", error);
    }
  };

  fetchPendingTasks();
}, []);

  if (loading) {
    return (
      <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto transition-colors">

      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
  Messages
</h2>

        {/* TASKS */}
  <button
  onClick={() => setShowTasks(true)}
  title="Tasks"
  className="relative w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-blue-600 dark:text-blue-400"
>
  <FaTasks size={16} />

  {pendingTaskCount > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
      {pendingTaskCount > 99 ? "99+" : pendingTaskCount}
    </span>
  )}
</button>

  {/* STARRED */}
  <button
    onClick={() => setShowStarred(true)}
    title="Starred Messages"
    className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-yellow-500"
  >
    <FaStar size={16} />
  </button>
      </div>

      <StarredMessages
        isOpen={showStarred}
        onClose={() => setShowStarred(false)}
      />
      <Tasks
  isOpen={showTasks}
  onClose={() => setShowTasks(false)}
  onPendingCountChange={setPendingTaskCount}
/>

      {chats.length === 0 ? (
        <div className="p-5 text-gray-500 dark:text-gray-400">
  No chats yet.
</div>
      ) : (
        chats.map((chat) => (
          <Link
            key={chat._id}
            to={`/chat/${chat._id}`}
            className={`flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
  chatId === chat._id
    ? "bg-gray-100 dark:bg-gray-800"
    : ""
}`}
          >
            <div className="relative">

            <img
              src={
                chat.otherUser?.profilePic
                || "/default-profile-picture.png"
              }
              alt={chat.otherUser?.name}
              className="w-12 h-12 rounded-full object-cover"
              />

            {onlineUsers.includes(chat.otherUser?._id) && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
            </div>

            <div className="flex-1 overflow-hidden">

              <h3 className="font-semibold truncate text-gray-900 dark:text-white">
                {chat.otherUser?.name}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
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