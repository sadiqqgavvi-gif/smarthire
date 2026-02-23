import { evaluateInterviewAnswer } from "../services/aiEvaluationService.js";

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
