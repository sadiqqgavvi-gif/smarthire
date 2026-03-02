import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Question from "../models/questionModel.js";
import {
  extractQuestionsFromMarkdown,
  normalizeQuestionKey,
} from "../utils/questionExtractor.js";

const BASE_PATH = path.resolve(process.cwd(), "topics/en");
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/smarthire";

const getCategory = (filePath) => {
  if (filePath.includes(`${path.sep}behavioral${path.sep}`)) return "behavioral";
  if (filePath.includes(`${path.sep}situational${path.sep}`)) return "situational";
  return "technical";
};

const assignDifficulty = (text) => {
  const words = text.trim().split(/\s+/).length;

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

const getAllMarkdownFiles = (dir, fileSet = new Set()) => {
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

const buildDataset = async () => {
  await mongoose.connect(MONGO_URI);
  await Question.deleteMany({});
  console.log("Cleared existing questions");

  const files = getAllMarkdownFiles(BASE_PATH);
  console.log(`Found ${files.length} markdown files`);

  const seenByCategory = new Map();
  let totalInserted = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const extractedQuestions = extractQuestionsFromMarkdown(content);
    const category = getCategory(filePath);

    if (!seenByCategory.has(category)) {
      seenByCategory.set(category, new Set());
    }

    const categorySeen = seenByCategory.get(category);
    const uniqueQuestions = extractedQuestions.filter((question) => {
      const key = normalizeQuestionKey(question);
      if (!key || categorySeen.has(key)) return false;
      categorySeen.add(key);
      return true;
    });

    if (!uniqueQuestions.length) {
      continue;
    }

    const docs = uniqueQuestions.map((question) => ({
      question,
      category,
      difficulty: assignDifficulty(question),
      role: "general",
      language: "en",
    }));

    try {
      await Question.insertMany(docs, { ordered: false });
      totalInserted += docs.length;
    } catch (error) {
      console.warn(`Partial insert failure for ${path.basename(filePath)}: ${error.message}`);
    }

    console.log(`${path.relative(BASE_PATH, filePath)} -> ${category} -> ${docs.length}`);
  }

  console.log(`Total questions inserted: ${totalInserted}`);
};

buildDataset()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Dataset build failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
