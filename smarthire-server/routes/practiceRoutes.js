import express from "express";
import Question from "../models/questionModel.js";
import protect from "../middleware/authMiddleware.js";
import PracticeSession from "../models/PracticeSession.js";
import { validatePracticeSessionPayload } from "../middleware/validationMiddleware.js";

const router = express.Router();

const buildUniqueQuestionPipeline = (filter, size, excludedQuestions = []) => {
  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        __normalizedQuestion: {
          $toLower: { $trim: { input: "$question" } },
        },
      },
    },
  ];

  if (excludedQuestions.length) {
    pipeline.push({
      $match: {
        __normalizedQuestion: { $nin: excludedQuestions },
      },
    });
  }

  pipeline.push(
    {
      $group: {
        _id: "$__normalizedQuestion",
        doc: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
    { $project: { __normalizedQuestion: 0 } },
    { $sample: { size } }
  );

  return pipeline;
};

router.post("/sessions", protect, validatePracticeSessionPayload, async (req, res) => {
  try {
    const {
      mode = "practice",
      category,
      difficulty = "",
      questionCount = 0,
      attemptedCount = 0,
      averageScore = 0,
    } = req.body;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const doc = await PracticeSession.create({
      user: req.user.id,
      mode,
      category,
      difficulty,
      questionCount: Number(questionCount) || 0,
      attemptedCount: Number(attemptedCount) || 0,
      averageScore: Number(averageScore) || 0,
    });

    return res.status(201).json({ success: true, session: doc });
  } catch (err) {
    console.error("Failed to save practice session:", err);
    return res.status(500).json({ message: "Failed to save session" });
  }
});

router.get("/sessions/me", protect, async (req, res) => {
  try {
    const sessions = await PracticeSession.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    const totalSessions = sessions.length;
    const completedInterviews = sessions.filter((s) => s.mode === "mock").length;
    const overallScore = totalSessions
      ? Math.round(
          sessions.reduce((sum, s) => sum + (Number(s.averageScore) || 0), 0) /
            totalSessions
        )
      : 0;

    const categoryMap = new Map();
    for (const session of sessions) {
      const key = session.category || "general";
      if (!categoryMap.has(key)) categoryMap.set(key, []);
      categoryMap.get(key).push(Number(session.averageScore) || 0);
    }

    const categoryScores = [...categoryMap.entries()].map(([name, values]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      score: Math.round(values.reduce((a, b) => a + b, 0) / values.length) * 10,
    }));

    return res.json({
      success: true,
      stats: { totalSessions, completedInterviews, overallScore },
      categoryScores,
      sessions,
    });
  } catch (err) {
    console.error("Failed to load sessions:", err);
    return res.status(500).json({ message: "Failed to load sessions" });
  }
});

router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { difficulty } = req.query;
    const parsedCount = Number.parseInt(req.query.count, 10);
    const count = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 3;
    const normalizedType = type.toLowerCase();

    const baseFilter = {
      category: normalizedType,
    };

    const filter = { ...baseFilter };

    if (difficulty && normalizedType !== "behavioral") {
      filter.difficulty = difficulty.toLowerCase();
    }

    let questions = await Question.aggregate(buildUniqueQuestionPipeline(filter, count));

    if (questions.length < count && filter.difficulty) {
      const remaining = count - questions.length;
      const seen = questions.map((q) => q.question.trim().toLowerCase());
      const extraQuestions = await Question.aggregate(
        buildUniqueQuestionPipeline(baseFilter, remaining, seen)
      );
      questions = [...questions, ...extraQuestions];
    }

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
