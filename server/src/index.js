import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";

dotenv.config();

const app = express();

/* -------------------- Middleware -------------------- */

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL, // your Netlify URL should be here in Render env vars
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow tools like curl/postman or same-origin (no Origin header)
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: false, // using Bearer token, not cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ PATCH added
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ✅ Handle preflight requests for all routes
app.options("*", cors(corsOptions));

app.use(express.json());

// Request logger (helps debugging)
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

/* -------------------- Routes -------------------- */
app.get("/", (req, res) => {
  res.send("Job Tracker API is running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

/* -------------------- Error handling -------------------- */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message || err);
  res.status(500).json({ message: err.message || "Server error" });
});

/* -------------------- DB + Server -------------------- */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
