import { evaluateInterviewAnswer } from "../services/aiEvaluationService.js";
import {
  evaluateWithPython,
  getPythonEvaluatorInfo,
} from "../services/pythonEvaluationService.js";

export const evaluateInterview = async (req, res) => {
  try {
    const { question, answer, category } = req.body;

    if (!answer || typeof answer !== "string" || !answer.trim()) {
      return res.status(400).json({
        success: false,
        score: 0,
        feedback: "No answer provided.",
        improvement: "Try answering the question clearly and concisely.",
      });
    }

    const evaluation = await evaluateInterviewAnswer({
      question,
      answer,
      category,
      mode: "practice",
    });

    return res.json({
      success: true,
      ...evaluation,
    });
  } catch (error) {
    console.error("Evaluation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Evaluation failed",
    });
  }
};

export const getPythonHealth = async (_req, res) => {
  const info = getPythonEvaluatorInfo();

  if (!info.enabled) {
    return res.json({
      success: true,
      status: "disabled",
      ...info,
      message: "Set USE_PYTHON_EVALUATOR=true to enable Python evaluator.",
    });
  }

  if (!info.scriptExists) {
    return res.status(500).json({
      success: false,
      status: "error",
      ...info,
      message: "Python evaluator script is missing.",
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

    return res.json({
      success: true,
      status: "ok",
      ...info,
      probe: {
        source: probe?.source || null,
        score: probe?.score ?? null,
      },
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: "error",
      ...info,
      message: error.message || "Python evaluator health check failed.",
    });
  }
};
