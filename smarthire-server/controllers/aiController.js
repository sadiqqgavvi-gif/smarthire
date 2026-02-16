export const evaluateInterview = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!answer) {
      return res.status(400).json({
        success: false,
        score: 0,
        feedback: "No answer provided.",
        improvement:
          "Try answering the question clearly and concisely.",
      });
    }

    // Simple temporary scoring logic
    const score = Math.min(10, Math.max(4, answer.length / 20));

    res.json({
      success: true,
      score: Math.round(score),
      feedback:
        "Your answer addresses the question but could be more structured.",
      improvement:
        "Add examples, mention tools/technologies, and conclude clearly.",
    });
  } catch (error) {
    console.error("Evaluation Error:", error);

    res.status(500).json({
      success: false,
      message: "Evaluation failed",
    });
  }
};
