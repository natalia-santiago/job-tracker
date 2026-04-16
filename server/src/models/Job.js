import mongoose from "mongoose";

/*
  Job Schema
  - Stores job applications per user
  - Optimized for filtering, sorting, and scaling
*/

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
      maxlength: 120,
    },

    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
      maxlength: 120,
    },

    status: {
      type: String,
      enum: ["applied", "interview", "offer", "rejected"],
      default: "applied",
      lowercase: true, // 🔥 ensures consistency
      index: true,     // 🔥 faster filtering
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

/* 🔥 Compound index for fast dashboard queries */
jobSchema.index({ user: 1, status: 1, createdAt: -1 });

export default mongoose.model("Job", jobSchema);