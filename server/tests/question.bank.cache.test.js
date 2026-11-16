import assert from "node:assert/strict";
import fs from "node:fs";
import zlib from "node:zlib";
import { test } from "node:test";
import {
  QUESTION_BANK_CACHE_PATH,
  getBundledQuestions,
  parseBundledQuestionsFromMarkdown,
  serializeQuestionBank,
} from "../utils/questionBank.js";

test("the committed question bank cache matches the markdown sources (run `npm run build:bank` if this fails)", () => {
  assert.ok(fs.existsSync(QUESTION_BANK_CACHE_PATH), "data/questionBank.json.gz is missing");
  const cached = JSON.parse(zlib.gunzipSync(fs.readFileSync(QUESTION_BANK_CACHE_PATH)).toString("utf-8"));
  const fresh = serializeQuestionBank(parseBundledQuestionsFromMarkdown());
  assert.deepEqual(cached.categories, fresh.categories);
});

test("getBundledQuestions returns unique questions of the requested category and difficulty", () => {
  const questions = getBundledQuestions({ category: "technical", difficulty: "hard", count: 15 });
  assert.equal(questions.length, 15);
  assert.equal(new Set(questions.map((q) => q._id)).size, 15);
  assert.ok(questions.every((q) => q.category === "technical" && q.difficulty === "hard"));
});

test("excluded questions are not returned", () => {
  const [first] = getBundledQuestions({ category: "behavioral", count: 1 });
  const next = getBundledQuestions({ category: "behavioral", count: 50, excludeQuestions: [first.question] });
  assert.ok(next.every((q) => q.question !== first.question));
});
