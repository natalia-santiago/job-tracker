import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 120,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Please enter a valid email address",
      },
    },

    // Hidden by default for security.
    // Explicitly select it only when needed during login.
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: 6,
      maxlength: 255,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for auth lookups
userSchema.index({ email: 1 });

export default mongoose.model("User", userSchema);