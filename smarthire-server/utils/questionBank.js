import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  extractQuestionsFromMarkdown,
  normalizeQuestionKey,
} from "./questionExtractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOPICS_PATH = path.resolve(__dirname, "../topics/en");

let cachedQuestions = null;

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

export const loadBundledQuestions = () => {
  if (cachedQuestions) return cachedQuestions;

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

  cachedQuestions = questions;
  return cachedQuestions;
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
    if (excluded.has(normalizeQuestionKey(item.question))) return false;
    if (normalizedRole && item.role !== normalizedRole) return false;
    return true;
  };

  let matches = loadBundledQuestions().filter((item) => {
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
    const extras = loadBundledQuestions().filter((item) => {
      const key = normalizeQuestionKey(item.question);
      return matchesBase(item) && !seen.has(key);
    });
    matches = [...matches, ...extras];
  }

  return matches.sort(() => Math.random() - 0.5).slice(0, size);
};
