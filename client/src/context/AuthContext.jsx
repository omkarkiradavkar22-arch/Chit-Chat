import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
 
  const getCachedUser = () => {
  try {
    const cachedUser = localStorage.getItem("chitchat_user");

    return cachedUser
      ? JSON.parse(cachedUser)
      : null;
  } catch {
    return null;
  }
};

const cachedUser = getCachedUser();

const [user, setUser] = useState(cachedUser);

// Cache असेल तर app लगेच render होऊ दे
const [loading, setLoading] = useState(!cachedUser);

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

    // Fresh user cache update
    localStorage.setItem(
      "chitchat_user",
      JSON.stringify(data.user)
    );

  } catch (error) {

    // Network / offline error
    if (!navigator.onLine || !error.response) {

      // Cached user already initial state मधून loaded आहे.
      // त्यामुळे इथे user null करू नको.
      const cachedUser =
        localStorage.getItem("chitchat_user");

      if (!cachedUser) {
        setUser(null);
      }

    } else {

      // Real authentication failure (401 etc.)
      localStorage.removeItem("chitchat_user");
      localStorage.removeItem("token");

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
