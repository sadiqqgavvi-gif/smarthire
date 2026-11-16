import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanQuestionText,
  extractQuestionsFromMarkdown,
  isLikelyQuestion,
  normalizeQuestionKey,
} from "../utils/questionExtractor.js";

test("cleanQuestionText removes markdown wrappers and prefixes", () => {
  const input = "Q1: [Let's talk Swing. What is the difference between a Choice and a List?](#anchor)";
  const cleaned = cleanQuestionText(input);

  assert.equal(
    cleaned,
    "Let's talk Swing. What is the difference between a Choice and a List?"
  );
});

test("extractQuestionsFromMarkdown keeps only unique question lines", () => {
  const content = `
## Java

[What is JVM?](#what-is-jvm)
### What is JVM?
A JVM executes bytecode.

[[↑] Back to top](#java)
* https://example.com/source
- Describe a situation where you had to resolve a conflict with a colleague?
`;

  const questions = extractQuestionsFromMarkdown(content);

  assert.deepEqual(questions, [
    "What is JVM?",
    "Describe a situation where you had to resolve a conflict with a colleague?",
  ]);
});

test("isLikelyQuestion rejects non-question lines", () => {
  assert.equal(isLikelyQuestion("A JVM executes bytecode."), false);
  assert.equal(isLikelyQuestion("Source"), false);
  assert.equal(isLikelyQuestion("https://example.com"), false);
});

test("normalizeQuestionKey collapses punctuation and spacing", () => {
  const key = normalizeQuestionKey("What is JVM?   ");
  assert.equal(key, "what is jvm?");
});
