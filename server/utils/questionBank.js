import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import {
  extractQuestionsFromMarkdown,
  normalizeQuestionKey,
} from "./questionExtractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOPICS_PATH = path.resolve(__dirname, "../topics/en");
// Pre-parsed copy of the markdown question bank (see scripts/buildQuestionBankCache.js).
// Parsing 30,000 questions from markdown takes ~1s on every serverless cold start;
// reading this compressed JSON takes a few tens of milliseconds.
export const QUESTION_BANK_CACHE_PATH = path.resolve(__dirname, "../data/questionBank.json.gz");

let cachedQuestions = null;
let cachedByCategory = null;

export const assignDifficulty = (text = "") => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  const hardKeywords = [
    "architecture",
    "scalability",
    "optimize",
    "design",
    "complex",
    "performance",
    "distributed",
    "security",
    "microservices",
    "algorithm",
  ];

  const easyKeywords = ["what is", "define", "list", "name", "basic", "simple"];
  const lower = text.toLowerCase();

  if (hardKeywords.some((keyword) => lower.includes(keyword)) || words > 30) {
    return "hard";
  }

  if (easyKeywords.some((keyword) => lower.startsWith(keyword)) || words < 12) {
    return "easy";
  }

  return "medium";
};

const getCategory = (filePath) => {
  if (filePath.includes(`${path.sep}behavioral${path.sep}`)) return "behavioral";
  if (filePath.includes(`${path.sep}situational${path.sep}`)) return "situational";
  return "technical";
};

const getAllMarkdownFiles = (dir, fileSet = new Set()) => {
  if (!fs.existsSync(dir)) return [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.resolve(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getAllMarkdownFiles(fullPath, fileSet);
      continue;
    }

    if (item.endsWith(".md")) {
      fileSet.add(fullPath);
    }
  }

  return [...fileSet];
};

const toQuestion = (category, question, difficulty, index) => ({
  _id: `bundled-${category}-${index + 1}`,
  question,
  category,
  difficulty,
  role: "general",
  source: "bundled",
});

const loadFromCache = () => {
  if (!fs.existsSync(QUESTION_BANK_CACHE_PATH)) return null;
  try {
    const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(QUESTION_BANK_CACHE_PATH)).toString("utf-8"));
    return Object.entries(data.categories).flatMap(([category, rows]) =>
      rows.map(([question, difficulty], index) => toQuestion(category, question, difficulty, index))
    );
  } catch (error) {
    console.warn("Question bank cache unreadable, parsing markdown instead:", error?.message || error);
    return null;
  }
};

// Compact form written to the cache: { categories: { technical: [[question, difficulty], ...] } }
export const serializeQuestionBank = (questions) => {
  const categories = {};
  for (const q of questions) {
    (categories[q.category] ||= []).push([q.question, q.difficulty]);
  }
  return { version: 1, generatedFrom: "topics/en", categories };
};

export const loadBundledQuestions = () => {
  if (cachedQuestions) return cachedQuestions;
  cachedQuestions = loadFromCache() || parseBundledQuestionsFromMarkdown();
  return cachedQuestions;
};

const getQuestionsByCategory = () => {
  if (!cachedByCategory) {
    cachedByCategory = new Map();
    for (const q of loadBundledQuestions()) {
      if (!cachedByCategory.has(q.category)) cachedByCategory.set(q.category, []);
      cachedByCategory.get(q.category).push(q);
    }
  }
  return cachedByCategory;
};

// Picks up to `size` random items without shuffling the whole list.
const sample = (items, size) => {
  if (items.length <= size) return [...items].sort(() => Math.random() - 0.5);
  const picked = new Set();
  while (picked.size < size) picked.add(Math.floor(Math.random() * items.length));
  return [...picked].map((index) => items[index]);
};

export const parseBundledQuestionsFromMarkdown = () => {
  const seenByCategory = new Map();
  const questions = [];

  for (const filePath of getAllMarkdownFiles(TOPICS_PATH)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const category = getCategory(filePath);

    if (!seenByCategory.has(category)) {
      seenByCategory.set(category, new Set());
    }

    const categorySeen = seenByCategory.get(category);

    for (const question of extractQuestionsFromMarkdown(content)) {
      const key = normalizeQuestionKey(question);
      if (!key || categorySeen.has(key)) continue;

      categorySeen.add(key);
      questions.push({
        _id: `bundled-${category}-${categorySeen.size}`,
        question,
        category,
        difficulty: assignDifficulty(question),
        role: "general",
        source: "bundled",
      });
    }
  }

  return questions;
};

export const getBundledQuestions = ({
  category,
  difficulty = "",
  role = "",
  count = 5,
  excludeQuestions = [],
} = {}) => {
  const normalizedCategory = String(category || "").toLowerCase();
  const normalizedDifficulty = String(difficulty || "").toLowerCase();
  const normalizedRole = String(role || "").toLowerCase();
  const excluded = new Set(excludeQuestions.map(normalizeQuestionKey).filter(Boolean));
  const size = Math.max(Number(count) || 5, 0);

  if (!normalizedCategory || size === 0) return [];

  const matchesBase = (item) => {
    if (item.category !== normalizedCategory) return false;
    // Normalising the text is a regex per question, so only do it when something is excluded.
    if (excluded.size && excluded.has(normalizeQuestionKey(item.question))) return false;
    if (normalizedRole && item.role !== normalizedRole) return false;
    return true;
  };

  const pool = getQuestionsByCategory().get(normalizedCategory) || [];

  let matches = pool.filter((item) => {
    if (!matchesBase(item)) return false;
    if (
      normalizedDifficulty &&
      normalizedDifficulty !== "any" &&
      normalizedCategory !== "behavioral"
    ) {
      return item.difficulty === normalizedDifficulty;
    }
    return true;
  });

  if (matches.length < size && normalizedDifficulty && normalizedDifficulty !== "any") {
    const seen = new Set(matches.map((item) => normalizeQuestionKey(item.question)));
    const extras = pool.filter((item) => {
      const key = normalizeQuestionKey(item.question);
      return matchesBase(item) && !seen.has(key);
    });
    matches = [...matches, ...extras];
  }

  return sample(matches, size);
};
