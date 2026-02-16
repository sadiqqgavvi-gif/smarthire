import Question from "../models/questionModel.js";
import OpenAI from "openai";
import { smartEvaluate } from "../services/smartEvaluator.js";

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

    const prompt = `
You are a professional job interviewer.

Category: ${category || "General"}

Question:
"${question}"

Candidate Answer:
"${answer}"

Evaluate the answer based on:
1. Clarity
2. Technical accuracy
3. Depth of explanation
4. Structure
5. Confidence level

Return response strictly in this JSON format:
{
  "score": number (1-10),
  "strengths": "string",
  "weaknesses": "string",
  "improvement": "string",
  "overall_feedback": "string"
}
`;

    let parsedResponse;

    // ================= USE LOCAL SMART EVALUATOR IF AI DISABLED =================
if (process.env.USE_AI !== "true") {
  const evaluation = smartEvaluate(question, answer, category);

  return res.status(200).json({
    success: true,
    evaluation,
  });
}


    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert technical interviewer." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      });

      const rawResponse = completion.choices[0].message.content;

      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch {
        // If OpenAI returns non-JSON, use raw text as fallback
        parsedResponse = { raw: rawResponse };
      }

    } catch (err) {
      console.error("AI Evaluation Error:", err);

      // Handle OpenAI quota/rate limit errors gracefully
      if (err.code === "insufficient_quota" || err.status === 429) {
        console.warn("OpenAI quota exceeded. Returning mock evaluation.");
      } else {
        console.warn("OpenAI failed. Returning mock evaluation.");
      }

      // --- Mock fallback response ---
      parsedResponse = {
        score: 7,
        strengths: "Clear and concise answer",
        weaknesses: "Could provide more examples",
        improvement: "Explain with more real-world examples",
        overall_feedback: "Good answer. Keep practicing for depth and clarity."
      };
    }

    return res.status(200).json({
      success: true,
      evaluation: parsedResponse,
    });

  } catch (error) {
    console.error("Unexpected Evaluation Error:", error);
    return res.status(500).json({
      success: false,
      message: "AI evaluation failed due to server error",
    });
  }
};