import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cleanQuestionText, normalizeQuestionKey } from "./questionExtractor.js";

// Builds an index of reference answers from the curated topic markdown files.
// Those files use "### Question?" headings followed by an explanation, which
// gives the evaluator a real answer key for many technical questions.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOPICS_PATH = path.join(__dirname, "..", "topics", "en");
const MAX_REFERENCE_LENGTH = 1200;
const MIN_REFERENCE_LENGTH = 40;

let cachedIndex = null;

const listMarkdownFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(fullPath);
    return entry.name.endsWith(".md") ? [fullPath] : [];
  });
};

const isSectionEnd = (line) =>
  /^#{1,3}\s/.test(line) || /back to top/i.test(line) || /^#{4,6}\s*source\b/i.test(line);

export const cleanReferenceText = (lines) => {
  const text = lines
    .join("\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/<[^>]+>/g, "") // html tags
    .replace(/^\s*[-*]\s+https?:\/\/\S+\s*$/gm, "") // bare source links
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length <= MAX_REFERENCE_LENGTH) return text;

  // Cut at a paragraph or sentence boundary so the answer stays readable.
  const slice = text.slice(0, MAX_REFERENCE_LENGTH);
  const fence = (slice.match(/```/g) || []).length;
  const boundary = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));
  let cut = boundary > 300 ? slice.slice(0, boundary + 1) : slice;
  if (fence % 2 === 1 && (cut.match(/```/g) || []).length % 2 === 1) cut += "\n```";
  return `${cut.trim()} …`;
};

export const parseReferenceAnswers = (markdown = "") => {
  const entries = [];
  const lines = markdown.split(/\r?\n/);
  let current = null;
  let inCode = false;

  const flush = () => {
    if (!current) return;
    const answer = cleanReferenceText(current.lines);
    if (answer.replace(/```[\s\S]*?```/g, "").trim().length >= MIN_REFERENCE_LENGTH) {
      entries.push({ question: current.question, answer });
    }
    current = null;
  };

  for (const line of lines) {
    if (/^```/.test(line.trim())) inCode = !inCode;

    if (!inCode && /^###\s+/.test(line)) {
      flush();
      const question = cleanQuestionText(line);
      current = question ? { question, lines: [] } : null;
      continue;
    }

    if (!current) continue;
    if (!inCode && isSectionEnd(line)) {
      flush();
      continue;
    }
    current.lines.push(line);
  }
  flush();

  return entries;
};

const buildIndex = () => {
  const index = new Map();
  for (const file of listMarkdownFiles(TOPICS_PATH)) {
    const content = fs.readFileSync(file, "utf-8");
    for (const entry of parseReferenceAnswers(content)) {
      const key = normalizeQuestionKey(entry.question);
      if (key && !index.has(key)) index.set(key, entry.answer);
    }
  }
  return index;
};

export const getReferenceAnswer = (question = "") => {
  if (!cachedIndex) {
    try {
      cachedIndex = buildIndex();
    } catch (error) {
      console.warn("Could not build reference answer index:", error?.message || error);
      cachedIndex = new Map();
    }
  }
  const key = normalizeQuestionKey(cleanQuestionText(question) || question);
  return cachedIndex.get(key) || "";
};

export const getReferenceAnswerCount = () => {
  getReferenceAnswer("");
  return cachedIndex.size;
};
