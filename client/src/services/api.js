import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token from localStorage as Authorization header.
// Needed because Vercel (frontend) and Render (backend) are different
// top-level domains -> browsers often block/partition the third-party
// SameSite=None auth cookie, so we fall back to a bearer token instead.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;