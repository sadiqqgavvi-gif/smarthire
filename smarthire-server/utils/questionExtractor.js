const MIN_QUESTION_LENGTH = 8;
const MAX_QUESTION_LENGTH = 280;
const MIN_WORD_COUNT = 3;
const MAX_WORD_COUNT = 50;

const URL_PATTERN = /https?:\/\//i;
const QUESTION_STARTER_PATTERN =
  /^(what|why|how|when|where|which|who|whom|whose|can|could|would|should|do|does|did|is|are|am|was|were|if|tell|describe|explain|give|name|list|compare|difference|let'?s|lets)\b/i;

const NOISE_PATTERNS = [
  /^source$/i,
  /^#+\s*source$/i,
  /^\[\[.*back to top.*\]\]$/i,
  /^\[\[.*\]\]$/,
  /^[-_]{3,}$/,
];

const toText = (value) => (typeof value === "string" ? value.trim() : "");

export const normalizeQuestionKey = (value = "") =>
  toText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s?]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const cleanQuestionText = (value = "") => {
  let line = toText(value);
  if (!line) return "";

  line = line
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)-]\s+/, "")
    .replace(/^q\d+\s*[:.)-]\s*/i, "")
    .replace(/^#+\s*/, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!line) return "";
  if (NOISE_PATTERNS.some((pattern) => pattern.test(line))) return "";
  if (URL_PATTERN.test(line)) return "";

  return line;
};

export const isLikelyQuestion = (value = "") => {
  const line = cleanQuestionText(value);
  if (!line) return false;
  if (!line.includes("?")) return false;
  if (line.length < MIN_QUESTION_LENGTH || line.length > MAX_QUESTION_LENGTH) {
    return false;
  }

  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORD_COUNT || words.length > MAX_WORD_COUNT) {
    return false;
  }

  if (!QUESTION_STARTER_PATTERN.test(line)) {
    return false;
  }

  return true;
};

export const extractQuestionsFromMarkdown = (content = "") => {
  const text = toText(content);
  if (!text) return [];

  const questions = [];
  const seen = new Set();
  let inCodeBlock = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    const candidate = cleanQuestionText(trimmed);
    if (!isLikelyQuestion(candidate)) continue;

    const key = normalizeQuestionKey(candidate);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    questions.push(candidate);
  }

  return questions;
};
