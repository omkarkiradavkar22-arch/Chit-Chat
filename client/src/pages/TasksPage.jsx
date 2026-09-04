import { useEffect, useState } from "react";
import Layout from "../components/layouts/Layout";
import api from "../services/api";
import { toast } from "react-hot-toast";
import {
  FaTasks,
  FaCheck,
  FaTrash,
  FaCalendar,
  FaFileAlt,
  FaHourglassHalf,
} from "react-icons/fa";

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get("/tasks");

      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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

      setTasks((prev) =>
        prev.filter((task) => task._id !== taskId)
      );

      toast.success("Task deleted");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete task"
      );
    }
  };

  const pendingCount = tasks.filter(
    (task) => !task.completed
  ).length;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-5 px-3 sm:px-0">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <FaTasks className="text-blue-600 text-2xl" />

          <h1 className="text-3xl font-bold">
            Tasks
          </h1>

          {pendingCount > 0 && (
            <span className="min-w-6 h-6 px-2 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </div>

        {/* CONTENT */}
        {loading ? (
          <p className="text-center text-gray-500 py-10">
            Loading tasks...
          </p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FaTasks
              className="mx-auto mb-3 opacity-40"
              size={35}
            />

            <p className="font-medium">
              No tasks yet.
            </p>

            <p className="text-sm mt-1">
              Create a task from a message.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className={`
                  border-b
                  border-gray-200
                  dark:border-gray-800
                  py-4
                  ${
                    task.completed
                      ? "opacity-70"
                      : ""
                  }
                `}
              >
                <div className="flex items-start justify-between gap-4">

                  <div className="flex-1 min-w-0">

                    <h3
                      className={`
                        font-semibold
                        flex
                        items-start
                        gap-2
                        ${
                          task.completed
                            ? "line-through text-gray-400"
                            : "text-gray-900 dark:text-white"
                        }
                      `}
                    >
                      <FaFileAlt className="mt-1 shrink-0" />

                      <span className="break-words">
                        {task.title || task.text}
                      </span>
                    </h3>

                    {task.deadline && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                        <FaCalendar />

                        {new Date(
                          task.deadline
                        ).toLocaleString()}
                      </p>
                    )}

                    <div className="mt-3">
                      {task.completed ? (
                        <span className="text-sm text-green-600 font-medium flex items-center gap-2">
                          <FaCheck />
                          Completed
                        </span>
                      ) : (
                        <span className="text-sm text-orange-500 font-medium flex items-center gap-2">
                          <FaHourglassHalf />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">

                    {!task.completed && (
                      <button
                        onClick={() =>
                          completeTask(task._id)
                        }
                        className="
                          bg-green-600
                          hover:bg-green-700
                          text-white
                          px-3
                          py-2
                          rounded-lg
                          text-sm
                          flex
                          items-center
                          gap-2
                          transition
                        "
                      >
                        <FaCheck size={12} />

                        <span className="hidden sm:inline">
                          Complete
                        </span>
                      </button>
                    )}

                    {task.completed && (
                      <button
                        onClick={() =>
                          deleteTask(task._id)
                        }
                        className="
                          w-9
                          h-9
                          flex
                          items-center
                          justify-center
                          text-gray-400
                          hover:text-red-500
                          transition
                        "
                        title="Delete task"
                      >
                        <FaTrash />
                      </button>
                    )}

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}

export default TasksPage;