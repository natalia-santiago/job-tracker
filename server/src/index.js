import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no Origin header (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

/* -------------------- Core Middleware -------------------- */
app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});

app.use(express.json({ limit: "1mb" }));

/* -------------------- Request Logger -------------------- */
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[REQ] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next();
});

/* -------------------- Routes -------------------- */
app.get("/", (req, res) => {
  res.send("Job Tracker API is running ✅");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

/* -------------------- 404 Handler -------------------- */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

/* -------------------- Error Handler -------------------- */
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message || err);

  // CORS-specific errors
  if (err.message?.startsWith("CORS blocked")) {
    return res.status(403).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    error: err.message || "Server error",
  });
});

/* -------------------- Startup -------------------- */
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      if (allowedOrigins.length) {
        console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
      }
    });
  } catch (err) {
    console.error("❌ Startup error:", err.message || err);
    process.exit(1);
  }
}

startServer();

/* -------------------- Graceful Shutdown -------------------- */
process.on("SIGINT", async () => {
  console.log("⚠️ SIGINT received. Closing server...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("⚠️ SIGTERM received. Closing server...");
  await mongoose.connection.close();
  process.exit(0);
});