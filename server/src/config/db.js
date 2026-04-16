const mongoose = require("mongoose");

/*
  MongoDB Connection
  - Handles connection safely
  - Provides clear logs
  - Prevents duplicate connections
*/

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is missing in environment variables");
    process.exit(1);
  }

  try {
    // Prevent re-connecting if already connected (safety for some environments)
    if (mongoose.connection.readyState === 1) {
      console.log("ℹ️ MongoDB already connected");
      return;
    }

    mongoose.set("strictQuery", true);

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected");

    // 🔥 Helpful connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // crash fast (important in production)
  }
}

module.exports = connectDB;