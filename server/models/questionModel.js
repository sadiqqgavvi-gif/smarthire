import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["technical", "behavioral", "situational"],
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      default: "",
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      lowercase: true,
      trim: true,
    },

    expected_keywords: [
      {
        type: String,
        trim: true,
      },
    ],

    sample_answer: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // auto adds createdAt + updatedAt
  }
);

export default mongoose.model("Question", questionSchema);
