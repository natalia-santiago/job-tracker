import axios from "axios";

/*
  ENV SETUP:

  Local:
    VITE_API_URL=http://localhost:5000/api

  Production (Render / Netlify / Vercel):
    VITE_API_URL=https://your-backend.onrender.com/api
*/

const rawBaseUrl = import.meta.env.VITE_API_URL;

if (!rawBaseUrl) {
  console.warn("VITE_API_URL is not defined. API requests will fail until it is set.");
}

const normalizedBaseUrl = rawBaseUrl?.replace(/\/+$/, "");

const api = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request if present
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

// Global response handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.code === "ECONNABORTED") {
      console.warn("API request timed out.");
    }

    if (!error?.response) {
      console.warn("Network error. The backend may be unavailable or waking up.");
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      console.warn("Unauthorized. Token may be invalid or expired.");
    }

    return Promise.reject(error);
  }
);

export default api;