import express from "express";
import Question from "../models/questionModel.js";

const router = express.Router();

router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { count = 3, difficulty } = req.query;

    const filter = {
      category: type.toLowerCase(),
    };

    if (difficulty && type !== "behavioral") {
      filter.difficulty = difficulty.toLowerCase();
    }

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: Number(count) } }
    ]);

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
