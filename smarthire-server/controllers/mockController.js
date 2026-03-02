import Question from "../models/questionModel.js";
import { evaluateInterviewAnswer } from "../services/aiEvaluationService.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

// ================= GET MOCK QUESTIONS =================
export const getMockQuestions = async (req, res) => {
  try {
    const category = req.params.category?.toLowerCase().trim();
    const role = req.query.role?.toLowerCase().trim();

    const allowedCategories = ["technical", "behavioral", "situational"];

    if (!category || !allowedCategories.includes(category)) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Valid category is required (technical, behavioral, situational)",
      });
    }

    const filter = { category };
    if (role) filter.role = role;

    const totalAvailable = await Question.countDocuments(filter);

    if (totalAvailable === 0) {
      return sendError(res, {
        status: 404,
        code: "NOT_FOUND",
        message: "No questions found for this category/role",
      });
    }

    const sampleSize = Math.min(totalAvailable, 10);

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: sampleSize } },
    ]);

    return sendSuccess(res, {
      category,
      total: questions.length,
      questions,
    }, 200);

  } catch (err) {
    console.error("Mock Interview Error:", err);
    return sendError(res, {
      status: 500,
      code: "MOCK_FETCH_ERROR",
      message: "Mock interview error",
    });
  }
};

// ================= EVALUATE ANSWER =================
export const evaluateMockAnswer = async (req, res) => {
  try {
    const { question, answer, category } = req.body;

    if (!question || !answer) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Question and answer are required",
      });
    }
    const evaluation = await evaluateInterviewAnswer({
      question,
      answer,
      category,
      mode: "mock",
    });

    return sendSuccess(res, {
      evaluation,
    }, 200);

  } catch (error) {
    console.error("Unexpected Evaluation Error:", error);
    return sendError(res, {
      status: 500,
      code: "MOCK_EVALUATION_FAILED",
      message: "AI evaluation failed due to server error",
    });
  }
};
