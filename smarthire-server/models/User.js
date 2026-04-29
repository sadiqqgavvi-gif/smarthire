import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      required: false,
      default: null,
      minlength: 6,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      lowercase: true,
      trim: true,
    },
    googleId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      lowercase: true,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
