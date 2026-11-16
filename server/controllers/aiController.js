import { evaluateInterviewAnswer } from "../services/aiEvaluationService.js";
import {
  evaluateWithPython,
  getPythonEvaluatorInfo,
} from "../services/pythonEvaluationService.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

export const evaluateInterview = async (req, res) => {
  try {
    const { question, answer, category } = req.body;

    if (!answer || typeof answer !== "string" || !answer.trim()) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "No answer provided.",
        details: {
          score: 0,
          feedback: "No answer provided.",
          improvement: "Try answering the question clearly and concisely.",
        },
      });
    }

    const evaluation = await evaluateInterviewAnswer({
      question,
      answer,
      category,
      mode: "practice",
    });

    return sendSuccess(res, {
      ...evaluation,
    });
  } catch (error) {
    console.error("Evaluation Error:", error);

    return sendError(res, {
      status: 500,
      code: "AI_EVALUATION_FAILED",
      message: "Evaluation failed",
    });
  }
};

export const getPythonHealth = async (_req, res) => {
  const info = getPythonEvaluatorInfo();

  if (!info.enabled) {
    return sendSuccess(res, {
      status: "disabled",
      ...info,
      message: "Set USE_PYTHON_EVALUATOR=true to enable Python evaluator.",
    });
  }

  if (!info.scriptExists) {
    return sendError(res, {
      status: 500,
      code: "PYTHON_EVALUATOR_MISSING",
      message: "Python evaluator script is missing.",
      details: {
        status: "error",
        ...info,
      },
    });
  }

  try {
    const probe = await evaluateWithPython({
      question: "Tell me about a conflict you resolved.",
      answer:
        "First I listened to both sides, aligned on goals, then tracked action items to closure.",
      category: "behavioral",
      mode: "practice",
      expectedKeywords: ["conflict", "outcome", "stakeholder"],
      sampleAnswer: "Use STAR with a measurable outcome.",
      useAi: process.env.USE_AI === "true",
      openaiApiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_EVALUATION_MODEL || "gpt-4o-mini",
    });

    return sendSuccess(res, {
      status: "ok",
      ...info,
      probe: {
        source: probe?.source || null,
        score: probe?.score ?? null,
      },
    });
  } catch (error) {
    return sendError(res, {
      status: 503,
      code: "PYTHON_HEALTH_CHECK_FAILED",
      message: error.message || "Python evaluator health check failed.",
      details: {
        status: "error",
        ...info,
      },
    });
  }
};
