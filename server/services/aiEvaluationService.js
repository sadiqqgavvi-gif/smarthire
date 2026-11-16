import OpenAI from "openai";
import Question from "../models/questionModel.js";
import { cleanQuestionText } from "../utils/questionExtractor.js";
import { analyzeAnswer, smartEvaluate } from "./smartEvaluator.js";
import { getReferenceAnswer } from "../utils/referenceAnswers.js";
import { isDatabaseConnected } from "../utils/database.js";
import { applyEvaluationGuardrails } from "./evaluationGuardrails.js";
import {
  evaluateWithPython,
  isPythonEvaluatorEnabled,
} from "./pythonEvaluationService.js";

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

const normalizeQuestionInput = (value) => {
  const raw = toStringOrFallback(value);
  if (!raw) return "";

  const cleaned = cleanQuestionText(raw);
  return cleaned || raw;
};

// Scores keep one decimal place (7.5/10) so small improvements are visible.
const normalizeScore = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(10, Math.round(n * 10) / 10));
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
  const cleanQuestion = normalizeQuestionInput(question);
  // Without a live connection Mongoose would buffer the query for seconds; skip it.
  if (!cleanQuestion || !isDatabaseConnected()) return null;

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
  const referenceAnswer = toStringOrFallback(questionContext?.reference_answer);

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
- Reference answer (use it as the answer key, the candidate does not need to match its wording):
${referenceAnswer ? referenceAnswer.slice(0, 1500) : "Not provided"}

Evaluate ONLY against the asked question and context above.
Hard constraints:
- If the answer is nonsensical, unreadable, or mostly off-topic, score must be between 1 and 3.
- Do not reward length if relevance is weak.

Primary weighting:
1) Relevance to the exact question (40%)
2) ${selectedRubric[0]} (25%)
3) ${selectedRubric[1]} (20%)
4) ${selectedRubric[2]} (15%)

Return STRICT JSON only:
{
  "score": number (1-10, one decimal place allowed),
  "criteria": {
    "relevance": number (0-10),
    "depth": number (0-10),
    "structure": number (0-10, for behavioral questions judge the STAR structure),
    "clarity": number (0-10),
    "examples": number (0-10)
  },
  "strengths": "1-2 sentences that quote what the candidate did well",
  "weaknesses": "1-2 sentences naming the specific gaps or missing concepts",
  "improvement": "one concrete action for the next answer",
  "overall_feedback": "concise overall judgment"
}`;
};

const CRITERIA_LABELS = {
  relevance: "Relevance",
  depth: "Depth",
  structure: "Structure",
  clarity: "Clarity",
  examples: "Examples",
};

// Prefer criteria scores from the AI model; otherwise use the engine's analysis.
const pickCriteria = (rawCriteria, analysis) => {
  if (rawCriteria && typeof rawCriteria === "object" && !Array.isArray(rawCriteria)) {
    const fromModel = Object.keys(CRITERIA_LABELS)
      .map((key) => ({ key, label: CRITERIA_LABELS[key], score: Number(rawCriteria[key]) }))
      .filter((c) => Number.isFinite(c.score))
      .map((c) => ({ ...c, score: Math.max(0, Math.min(10, Math.round(c.score * 10) / 10)) }));
    if (fromModel.length >= 3) return fromModel;
  }
  return analysis?.criteria || [];
};

const finalizeEvaluation = ({
  rawEvaluation,
  source,
  model = null,
  question,
  answer,
  category = "general",
  expectedKeywords = [],
  referenceAnswer = "",
  analysis = null,
  usedQuestionContext = false,
}) => {
  const normalized = normalizeEvaluation(rawEvaluation);
  const guarded = applyEvaluationGuardrails(normalized, {
    question,
    answer,
    expectedKeywords,
  });

  const details =
    analysis ||
    analyzeAnswer({ question, answer, category, referenceAnswer, expectedKeywords });

  return {
    ...guarded,
    feedback: guarded.overall_feedback,
    criteria: pickCriteria(rawEvaluation?.criteria, details),
    fillerWords: details.fillerWords,
    missingConcepts: details.missingConcepts,
    wordCount: details.wordCount,
    referenceAnswer: referenceAnswer || null,
    source,
    model,
    usedQuestionContext: usedQuestionContext || Boolean(referenceAnswer),
  };
};

export const evaluateInterviewAnswer = async ({
  question,
  answer,
  category = "general",
  mode = "practice",
}) => {
  const safeQuestion = normalizeQuestionInput(question);
  const safeAnswer = toStringOrFallback(answer);
  const safeCategory = normalizeCategory(category) || "general";

  if (!safeAnswer) {
    const empty = smartEvaluate(safeQuestion, safeAnswer, safeCategory);
    return {
      ...empty,
      feedback: empty.overall_feedback,
      referenceAnswer: null,
      source: "smart-evaluator",
      usedQuestionContext: false,
    };
  }

  let questionContext = null;
  try {
    questionContext = await loadQuestionContext(safeQuestion, safeCategory);
  } catch (error) {
    console.warn("Question context lookup failed:", error?.message || error);
  }
  const expectedKeywords = questionContext?.expected_keywords || [];
  const referenceAnswer =
    getReferenceAnswer(safeQuestion) || toStringOrFallback(questionContext?.sample_answer);
  const engineContext = { referenceAnswer, expectedKeywords };
  const common = {
    question: safeQuestion,
    answer: safeAnswer,
    category: safeCategory,
    expectedKeywords,
    referenceAnswer,
    usedQuestionContext: Boolean(questionContext),
  };

  if (isPythonEvaluatorEnabled()) {
    try {
      const pythonResult = await evaluateWithPython({
        question: safeQuestion,
        answer: safeAnswer,
        category: safeCategory,
        mode,
        expectedKeywords,
        sampleAnswer: referenceAnswer || questionContext?.sample_answer || "",
        useAi: process.env.USE_AI === "true",
        openaiApiKey: process.env.OPENAI_API_KEY || "",
        model: DEFAULT_MODEL,
      });

      if (pythonResult && typeof pythonResult === "object") {
        return finalizeEvaluation({
          ...common,
          rawEvaluation: pythonResult,
          source: pythonResult.source || "python-evaluator",
          model: pythonResult.model || null,
        });
      }
    } catch (pythonError) {
      console.warn("Python evaluator failed. Falling back to Node evaluator:", pythonError);
    }
  }

  const client = getOpenAiClient();

  if (!client) {
    const fallback = smartEvaluate(safeQuestion, safeAnswer, safeCategory, engineContext);
    return finalizeEvaluation({
      ...common,
      rawEvaluation: fallback,
      analysis: fallback,
      source: "smart-evaluator",
    });
  }

  try {
    const prompt = buildPrompt({
      mode,
      category: safeCategory,
      question: safeQuestion,
      answer: safeAnswer,
      questionContext: { ...questionContext, reference_answer: referenceAnswer },
    });

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You evaluate interview answers fairly and return only valid JSON.",
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

    return finalizeEvaluation({
      ...common,
      rawEvaluation: parsed,
      source: "openai",
      model: DEFAULT_MODEL,
    });
  } catch (error) {
    console.error("AI evaluation failed. Falling back to smart evaluator:", error);
    const fallback = smartEvaluate(safeQuestion, safeAnswer, safeCategory, engineContext);

    return finalizeEvaluation({
      ...common,
      rawEvaluation: fallback,
      analysis: fallback,
      source: "smart-evaluator",
    });
  }
};
