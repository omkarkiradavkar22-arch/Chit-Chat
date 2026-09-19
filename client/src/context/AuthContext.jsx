import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem("darkMode", newValue);
      return newValue;
    });
  };

  const loadUser = async () => {
  try {
    const { data } = await api.get("/auth/me");

    setUser(data.user);

    // Save logged-in user for offline startup
    localStorage.setItem(
      "chitchat_user",
      JSON.stringify(data.user)
    );
  } catch (error) {
    // Internet OFF / network unavailable
    if (!navigator.onLine || !error.response) {
      try {
        const cachedUser =
          localStorage.getItem("chitchat_user");

        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          console.log("📦 Using cached user offline");
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    } else {
      // Server actually rejected authentication
      // e.g. 401 expired/invalid session
      localStorage.removeItem("chitchat_user");
      setUser(null);
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadUser();
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(error);
    } finally {
     localStorage.removeItem("token");
localStorage.removeItem("chitchat_user");
setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        loadUser,
        logout,
        darkMode,
        setDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
