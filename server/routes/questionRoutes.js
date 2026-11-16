import express from "express";
import { getQuestions } from "../controllers/questionController.js";
import protect from "../middleware/authMiddleware.js";
import Question from "../models/questionModel.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const router = express.Router();

router.get("/", getQuestions);

router.get("/debug", protect, async (req, res) => {
  try {
    const { category, difficulty, count } = req.query;
    const query = {};

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.find(query).limit(Number(count) || 10);
    return sendSuccess(res, { questions });
  } catch (err) {
    console.error("Questions debug route failed:", err);
    return sendError(res, {
      status: 500,
      code: "QUESTIONS_DEBUG_FETCH_FAILED",
      message: "Failed to fetch questions (debug)",
    });
  }
});

export default router;
