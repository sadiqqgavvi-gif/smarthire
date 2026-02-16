import Question from "../models/questionModel.js";

export const getQuestions = async (req, res) => {
  try {
    console.log("📌 Query Params:", req.query);

    const category = req.query.category?.toLowerCase();
    const difficulty = req.query.difficulty?.toLowerCase();
    const role = req.query.role?.toLowerCase();
    const count = parseInt(req.query.count) || 5;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Build Mongo filter
    const filter = { category };

    // Behavioral questions → ignore difficulty
    if (category !== "behavioral" && difficulty && difficulty !== "any") {
      filter.difficulty = difficulty;
    }

    if (role) {
      filter.role = role;
    }

    // Always random questions
    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: count } },
    ]);

    console.log(`✅ Returned ${questions.length} questions`);

    res.json({
      success: true,
      total: questions.length,
      questions,
    });
  } catch (error) {
    console.error("❌ getQuestions error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching questions",
    });
  }
};
