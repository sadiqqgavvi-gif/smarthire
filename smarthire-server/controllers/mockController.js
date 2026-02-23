import Question from "../models/questionModel.js";
import { evaluateInterviewAnswer } from "../services/aiEvaluationService.js";

// ================= GET MOCK QUESTIONS =================
export const getMockQuestions = async (req, res) => {
  try {
    const category = req.params.category?.toLowerCase().trim();
    const role = req.query.role?.toLowerCase().trim();

    const allowedCategories = ["technical", "behavioral", "situational"];

    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Valid category is required (technical, behavioral, situational)",
      });
    }

    const filter = { category };
    if (role) filter.role = role;

    const totalAvailable = await Question.countDocuments(filter);

    if (totalAvailable === 0) {
      return res.status(404).json({
        success: false,
        message: "No questions found for this category/role",
      });
    }

    const sampleSize = Math.min(totalAvailable, 5);

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: sampleSize } },
    ]);

    return res.status(200).json({
      success: true,
      category,
      total: questions.length,
      questions,
    });

  } catch (err) {
    console.error("Mock Interview Error:", err);
    return res.status(500).json({
      success: false,
      message: "Mock interview error",
    });
  }
};

// ================= EVALUATE ANSWER =================
export const evaluateMockAnswer = async (req, res) => {
  try {
    const { question, answer, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required",
      });
    }
    const evaluation = await evaluateInterviewAnswer({
      question,
      answer,
      category,
      mode: "mock",
    });

    return res.status(200).json({
      success: true,
      evaluation,
    });

  } catch (error) {
    console.error("Unexpected Evaluation Error:", error);
    return res.status(500).json({
      success: false,
      message: "AI evaluation failed due to server error",
    });
  }
};
