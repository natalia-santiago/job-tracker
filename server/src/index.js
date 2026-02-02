import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";

dotenv.config();

const app = express();

/* -------------------- Middleware -------------------- */

// Configure allowed origins (local + deployed)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL, // set this to your deployed frontend URL on Render later
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow tools like curl/postman or same-origin (no Origin header)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(null, false);
    },
    credentials: false, // IMPORTANT: using Bearer token, not cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Request logger (helps debugging)
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

/* -------------------- Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

/* -------------------- Health Check -------------------- */
app.get("/", (req, res) => {
  res.send("Job Tracker API running");
});

/* -------------------- Global Error Handler -------------------- */
app.use((err, req, res, next) => {
  console.error("❌ UNHANDLED SERVER ERROR:", err);
  res.status(500).json({ error: err?.message || "Server error" });
});

/* -------------------- Database -------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* -------------------- Server -------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});




