import OpenAI from "openai";
import Question from "../models/questionModel.js";
import { smartEvaluate } from "./smartEvaluator.js";

const DEFAULT_MODEL = process.env.OPENAI_EVALUATION_MODEL || "gpt-4o-mini";
const INVALID_OPENAI_KEYS = new Set(["", "your_key_here", "YOUR_KEY_HERE"]);

let cachedClient = null;

const normalizeCategory = (value = "") => String(value).trim().toLowerCase();

const hasValidOpenAiKey = () => {
  const key = String(process.env.OPENAI_API_KEY || "").trim();
  return Boolean(key) && !INVALID_OPENAI_KEYS.has(key);
};

const isAiEnabled = () => process.env.USE_AI === "true" && hasValidOpenAiKey();

const getOpenAiClient = () => {
  if (!isAiEnabled()) return null;
  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return cachedClient;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toStringOrFallback = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const normalizeScore = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(10, Math.round(n)));
};

const defaultWeakness = "Add more specific details directly tied to the question.";
const defaultImprovement =
  "Use a clear structure, answer each part of the question, and include one concrete example.";

const normalizeEvaluation = (raw) => {
  const score = normalizeScore(raw?.score);

  return {
    score: score ?? 5,
    strengths: toStringOrFallback(
      raw?.strengths,
      "Answer attempts to address the interview prompt."
    ),
    weaknesses: toStringOrFallback(raw?.weaknesses, defaultWeakness),
    improvement: toStringOrFallback(
      raw?.improvement || raw?.improvements,
      defaultImprovement
    ),
    overall_feedback: toStringOrFallback(
      raw?.overall_feedback || raw?.overallFeedback || raw?.feedback,
      "Reasonable attempt. Improve relevance and depth for a stronger response."
    ),
  };
};

const parseEvaluationJson = (content) => {
  if (typeof content !== "string") return null;

  const trimmed = content.trim();
  if (!trimmed) return null;

  const withoutCodeFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(withoutCodeFence);
  } catch {
    return null;
  }
};

const loadQuestionContext = async (question, category) => {
  const cleanQuestion = toStringOrFallback(question);
  if (!cleanQuestion) return null;

  const questionRegex = new RegExp(`^${escapeRegex(cleanQuestion)}$`, "i");
  const normalizedCategory = normalizeCategory(category);

  const baseProjection =
    "question category difficulty role expected_keywords sample_answer";

  let doc = null;

  if (normalizedCategory) {
    doc = await Question.findOne({
      question: questionRegex,
      category: normalizedCategory,
    })
      .select(baseProjection)
      .lean();
  }

  if (!doc) {
    doc = await Question.findOne({
      question: questionRegex,
    })
      .select(baseProjection)
      .lean();
  }

  return doc;
};

const buildPrompt = ({
  mode = "practice",
  category = "general",
  question,
  answer,
  questionContext,
}) => {
  const rubricByCategory = {
    technical: [
      "Accuracy of technical explanation",
      "Depth of reasoning and tradeoff awareness",
      "Completeness with respect to asked constraints",
    ],
    behavioral: [
      "Use of concrete STAR-style example",
      "Ownership, reflection, and measurable outcome",
      "Communication clarity and professionalism",
    ],
    situational: [
      "Decision quality under constraints",
      "Structured reasoning and prioritization",
      "Risk awareness and practical execution",
    ],
    general: [
      "Direct relevance to the exact question",
      "Depth and specificity",
      "Clarity and structure",
    ],
  };

  const normalizedCategory = normalizeCategory(category);
  const selectedRubric =
    rubricByCategory[normalizedCategory] || rubricByCategory.general;

  const expectedKeywords = Array.isArray(questionContext?.expected_keywords)
    ? questionContext.expected_keywords.filter(Boolean).slice(0, 12)
    : [];

  const sampleAnswer = toStringOrFallback(questionContext?.sample_answer);

  return `You are a strict interview evaluator.

Mode: ${mode}
Category: ${normalizedCategory || "general"}

Question:
"${question}"

Candidate answer:
"${answer}"

Question-specific context from dataset (if available):
- Expected keywords: ${expectedKeywords.length ? expectedKeywords.join(", ") : "Not provided"}
- Sample answer guidance: ${sampleAnswer || "Not provided"}

Evaluate ONLY against the asked question and context above.
Primary weighting:
1) Relevance to the exact question (40%)
2) ${selectedRubric[0]} (25%)
3) ${selectedRubric[1]} (20%)
4) ${selectedRubric[2]} (15%)

Return STRICT JSON only:
{
  "score": number (1-10 integer),
  "strengths": "short paragraph",
  "weaknesses": "short paragraph",
  "improvement": "specific action plan for next answer",
  "overall_feedback": "concise overall judgment"
}`;
};

export const evaluateInterviewAnswer = async ({
  question,
  answer,
  category = "general",
  mode = "practice",
}) => {
  const safeQuestion = toStringOrFallback(question);
  const safeAnswer = toStringOrFallback(answer);
  const safeCategory = normalizeCategory(category) || "general";

  if (!safeAnswer) {
    const empty = smartEvaluate(safeQuestion, safeAnswer, safeCategory);
    return {
      ...empty,
      feedback: empty.overall_feedback,
      source: "smart-evaluator",
      usedQuestionContext: false,
    };
  }

  const questionContext = await loadQuestionContext(safeQuestion, safeCategory);

  const client = getOpenAiClient();

  if (!client) {
    const fallback = smartEvaluate(safeQuestion, safeAnswer, safeCategory);
    return {
      ...fallback,
      feedback: fallback.overall_feedback,
      source: "smart-evaluator",
      usedQuestionContext: Boolean(questionContext),
    };
  }

  try {
    const prompt = buildPrompt({
      mode,
      category: safeCategory,
      question: safeQuestion,
      answer: safeAnswer,
      questionContext,
    });

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You evaluate interview answers fairly and return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const rawContent = completion?.choices?.[0]?.message?.content || "";
    const parsed = parseEvaluationJson(rawContent);

    if (!parsed) {
      throw new Error("AI evaluator returned invalid JSON.");
    }

    const evaluation = normalizeEvaluation(parsed);

    return {
      ...evaluation,
      feedback: evaluation.overall_feedback,
      source: "openai",
      model: DEFAULT_MODEL,
      usedQuestionContext: Boolean(questionContext),
    };
  } catch (error) {
    console.error("AI evaluation failed. Falling back to smart evaluator:", error);
    const fallback = smartEvaluate(safeQuestion, safeAnswer, safeCategory);

    return {
      ...fallback,
      feedback: fallback.overall_feedback,
      source: "smart-evaluator",
      usedQuestionContext: Boolean(questionContext),
    };
  }
};
