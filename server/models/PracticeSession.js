import mongoose from "mongoose";

const practiceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["practice", "mock"],
      default: "practice",
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed", ""],
      default: "",
      lowercase: true,
      trim: true,
    },
    questionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    attemptedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PracticeSession", practiceSessionSchema);
