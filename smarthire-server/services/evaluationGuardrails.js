const STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "being",
  "between",
  "could",
  "would",
  "should",
  "there",
  "their",
  "them",
  "then",
  "this",
  "that",
  "with",
  "from",
  "have",
  "your",
  "what",
  "when",
  "where",
  "which",
  "while",
]);

const toText = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const clampScore = (value, minimum = 1, maximum = 10) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(numeric)));
};

const tokenize = (value = "") =>
  toText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const buildQuestionTerms = (question = "") =>
  tokenize(question)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
    .slice(0, 30);

const normalizeExpectedKeywords = (expectedKeywords = []) =>
  Array.isArray(expectedKeywords)
    ? expectedKeywords
        .map((keyword) => toText(keyword).toLowerCase())
        .filter(Boolean)
        .slice(0, 12)
    : [];

export const getEvaluationRiskSignals = ({
  question = "",
  answer = "",
  expectedKeywords = [],
} = {}) => {
  const answerText = toText(answer).toLowerCase();
  const answerTokens = tokenize(answerText);
  const answerWordCount = answerTokens.length;

  const questionTerms = buildQuestionTerms(question);
  const questionHits = questionTerms.reduce(
    (count, term) => (answerText.includes(term) ? count + 1 : count),
    0
  );

  const keywordHits = normalizeExpectedKeywords(expectedKeywords).reduce(
    (count, keyword) => (answerText.includes(keyword) ? count + 1 : count),
    0
  );

  const consonantHeavyWords = answerTokens.filter(
    (word) => word.length >= 4 && !/[aeiou]/.test(word)
  ).length;

  const consonantHeavyRatio = answerWordCount
    ? consonantHeavyWords / answerWordCount
    : 1;

  const tooShort = answerWordCount < 4;
  const offTopic = answerWordCount >= 4 && questionHits === 0 && keywordHits === 0;
  const gibberish =
    answerWordCount >= 4 &&
    answerWordCount <= 30 &&
    offTopic &&
    consonantHeavyRatio >= 0.55;

  return {
    answerWordCount,
    questionHits,
    keywordHits,
    tooShort,
    offTopic,
    gibberish,
  };
};

export const applyEvaluationGuardrails = (
  evaluation = {},
  { question = "", answer = "", expectedKeywords = [] } = {}
) => {
  const safeScore = clampScore(evaluation?.score ?? 5, 1, 10);
  const normalized = {
    ...evaluation,
    score: safeScore,
    weaknesses: toText(evaluation?.weaknesses, "Needs stronger relevance and depth."),
    improvement: toText(
      evaluation?.improvement,
      "Answer directly, add one concrete example, and close with outcome."
    ),
    overall_feedback: toText(
      evaluation?.overall_feedback,
      "Reasonable attempt. Improve relevance and depth."
    ),
  };

  const signals = getEvaluationRiskSignals({
    question,
    answer,
    expectedKeywords,
  });

  if (signals.tooShort) {
    return {
      ...normalized,
      score: Math.min(normalized.score, 2),
      weaknesses: "Answer is too short to evaluate against the question requirements.",
      improvement:
        "Provide a complete answer with 2-3 concrete points tied to the exact question.",
      overall_feedback: "Insufficient answer quality for reliable interview evaluation.",
    };
  }

  if (signals.gibberish) {
    return {
      ...normalized,
      score: Math.min(normalized.score, 2),
      weaknesses: "Answer appears nonsensical or unreadable and does not match the prompt.",
      improvement:
        "Write clear sentences and directly address the question using relevant technical terms.",
      overall_feedback: "Response quality is too low to demonstrate interview readiness.",
    };
  }

  if (signals.offTopic && signals.answerWordCount < 35) {
    return {
      ...normalized,
      score: Math.min(normalized.score, 3),
      weaknesses: "Answer is mostly off-topic relative to the exact question.",
      improvement:
        "Start with a direct answer to the question, then support it with one specific example.",
      overall_feedback: "Response needs stronger relevance to the asked prompt.",
    };
  }

  return normalized;
};
