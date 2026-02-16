import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Question from "../models/questionModel.js";

const BASE_PATH = path.resolve(process.cwd(), "topics/en");

await mongoose.connect("mongodb://localhost:27017/smarthire");

await Question.deleteMany({});
console.log("🧹 Cleared existing questions");

/* ================= CATEGORY DETECTION ================= */

function getCategory(filePath) {
  if (filePath.includes(`${path.sep}behavioral${path.sep}`)) return "behavioral";
  if (filePath.includes(`${path.sep}situational${path.sep}`)) return "situational";
  return "technical";
}

/* ================= DIFFICULTY ASSIGNMENT (FIXED) ================= */

function assignDifficulty(text) {
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
    "algorithm"
  ];

  const easyKeywords = [
    "what is",
    "define",
    "list",
    "name",
    "basic",
    "simple"
  ];

  const lower = text.toLowerCase();

  if (hardKeywords.some(k => lower.includes(k)) || words > 30)
    return "hard";

  if (easyKeywords.some(k => lower.startsWith(k)) || words < 12)
    return "easy";

  return "medium";
}

/* ================= QUESTION EXTRACTION ================= */

function extractQuestions(content) {
  return content
    .split("\n")
    .map(line =>
      line
        .trim()
        .replace(/^[-*•]\s*/, "")
        .replace(/^\d+\.\s*/, "")
    )
    .filter(q => q.length > 15);
}

/* ================= RECURSIVE FILE SCAN ================= */

function getAllMarkdownFiles(dir, fileSet = new Set()) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.resolve(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getAllMarkdownFiles(fullPath, fileSet);
    } else if (item.endsWith(".md")) {
      fileSet.add(fullPath);
    }
  }

  return [...fileSet];
}

/* ================= BUILD DATASET ================= */

async function buildDataset() {
  const files = getAllMarkdownFiles(BASE_PATH);
  console.log(`📂 Found ${files.length} markdown files`);

  let total = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const questions = extractQuestions(content);
    const category = getCategory(filePath);

    if (!questions.length) continue;

    const docs = questions.map(q => ({
      question: q,
      category,
      difficulty: assignDifficulty(q), // ⭐ FIXED
      role: "general",
      language: "en"
    }));

    await Question.insertMany(docs, { ordered: false }).catch(() => {});
    total += docs.length;

    console.log(
      `📄 ${path.relative(BASE_PATH, filePath)} → ${category} → ${docs.length}`
    );
  }

  console.log(`🎉 TOTAL QUESTIONS INSERTED: ${total}`);
  process.exit(0);
}

buildDataset();
