import fs from "fs";
import path from "path";
import {
  extractQuestionsFromMarkdown,
  normalizeQuestionKey,
} from "../utils/questionExtractor.js";

const BASE_PATH = path.join(process.cwd(), "topics", "en");

export const getRandomMockQuestions = (category, count = 5) => {
  const categoryPath = path.join(BASE_PATH, category);

  if (!fs.existsSync(categoryPath)) {
    throw new Error("Invalid category");
  }

  const files = fs.readdirSync(categoryPath);
  const seen = new Set();
  const allQuestions = [];

  for (const file of files) {
    const filePath = path.join(categoryPath, file);
    if (!fs.statSync(filePath).isFile()) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const questions = extractQuestionsFromMarkdown(content);

    for (const question of questions) {
      const key = normalizeQuestionKey(question);
      if (!key || seen.has(key)) continue;

      seen.add(key);
      allQuestions.push(question);
    }
  }

  if (allQuestions.length < count) {
    throw new Error("Not enough questions in dataset");
  }

  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
