import { useEffect, useState } from "react";
import api from "../../services/api";
import { FaTimes, FaTasks, FaCheck, FaTrash,
  FaCalendar,
  FaFileAlt,
  FaHourglassHalf,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

function Tasks({ isOpen, onClose, onPendingCountChange }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/tasks");

      if (data.success) {
  const taskList = data.tasks || [];

  setTasks(taskList);

  const pendingCount = taskList.filter(
    (task) => !task.completed
  ).length;

  onPendingCountChange?.(pendingCount);
}
    } catch (error) {
      console.error("Failed to load tasks:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen]);

  const completeTask = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/complete`);

     setTasks((prev) =>
  prev.map((task) =>
    task._id === taskId
      ? { ...task, completed: true }
      : task
  )
);

onPendingCountChange?.((prev) => Math.max(0, prev - 1));

      toast.success("Task completed ✅");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to complete task"
      );
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);

      const deletedTask = tasks.find(
        (task) => task._id === taskId
      );

      setTasks((prev) =>
        prev.filter((task) => task._id !== taskId)
      );

      onPendingCountChange?.((prev) =>
        deletedTask && !deletedTask.completed
          ? Math.max(0, prev - 1)
          : prev
      );

      toast.success("Task deleted");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete task"
      );
    }
  };

  if (!isOpen) return null;

  const incompleteTasks = tasks.filter(
    (task) => !task.completed
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">

          <div className="flex items-center gap-2">
            <FaTasks className="text-blue-600" />

            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
              My Tasks
            </h2>

            {incompleteTasks.length > 0 && (
              <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                {incompleteTasks.length}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            <FaTimes />
          </button>

        </div>

        {/* TASK LIST */}
        <div className="flex-1 overflow-y-auto p-4">

          {loading ? (
            <p className="text-center py-10 text-gray-500">
              Loading tasks...
            </p>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaTasks
                className="mx-auto mb-3 opacity-40"
                size={30}
              />

              <p>No tasks yet.</p>

              <p className="text-sm mt-1">
                Create a task from a message.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {tasks.map((task) => (
                <div
                  key={task._id}
                  className={`p-4 rounded-xl border ${
                    task.completed
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >

                  {/* TASK TITLE */}
                  <div className="flex items-start justify-between gap-3">

                    <div className="flex-1">

                      <h3
                        className={`font-semibold inline-flex items-center gap-1${
                          task.completed
                            ? "line-through text-gray-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        <FaFileAlt/> {task.title || task.text}
                      </h3>

                      {/* DEADLINE */}
                      {task.deadline && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 inline-flex items-center gap-1">
                          <FaCalendar/> Deadline:{" "}
                          {new Date(
                            task.deadline
                          ).toLocaleString()}
                        </p>
                      )}

                    </div>

                    {/* DELETE */}
                    <button
                      onClick={() =>
                        deleteTask(task._id)
                      }
                      className="text-gray-400 hover:text-red-500"
                      title="Delete task"
                    >
                      <FaTrash size={14} />
                    </button>

                  </div>

                  {/* STATUS */}
                  <div className="mt-3 flex items-center justify-between">

                    {task.completed ? (
                      <span className="text-sm font-medium text-green-600">
                        ✅ Completed
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-orange-500 inline-flex items-center gap-1">
                        <FaHourglassHalf/> Pending
                      </span>
                    )}

                    {!task.completed && (
                      <button
                        onClick={() =>
                          completeTask(task._id)
                        }
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
                      >
                        <FaCheck size={12} />
                        Complete
                      </button>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default Tasks;
