// Regenerates data/questionBank.json.gz from the markdown files in topics/en.
// Run after changing the question banks: npm run build:bank
import fs from "fs";
import path from "path";
import zlib from "zlib";
import {
  QUESTION_BANK_CACHE_PATH,
  parseBundledQuestionsFromMarkdown,
  serializeQuestionBank,
} from "../utils/questionBank.js";

const questions = parseBundledQuestionsFromMarkdown();
const json = JSON.stringify(serializeQuestionBank(questions));
fs.mkdirSync(path.dirname(QUESTION_BANK_CACHE_PATH), { recursive: true });
fs.writeFileSync(QUESTION_BANK_CACHE_PATH, zlib.gzipSync(json, { level: 9 }));

const counts = questions.reduce((acc, q) => ({ ...acc, [q.category]: (acc[q.category] || 0) + 1 }), {});
console.log(
  `Wrote ${questions.length} questions (${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ")}) to ${path.relative(process.cwd(), QUESTION_BANK_CACHE_PATH)}`
);
