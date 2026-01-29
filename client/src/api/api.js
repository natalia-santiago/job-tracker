import axios from "axios";

/*
  ENV SETUP:

  Local:
    VITE_API_URL=http://localhost:5000/api

  Production (Render / Netlify / Vercel):
    VITE_API_URL=https://your-backend.onrender.com/api
*/

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach token to every request (if present)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: global response handling (future-proofing)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired / invalid → auto logout later if you want
    if (error?.response?.status === 401) {
      console.warn("Unauthorized — token may be invalid or expired");
    }

    return Promise.reject(error);
  }
);

export default api;
