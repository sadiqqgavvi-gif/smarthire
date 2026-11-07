import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeAnswer, detectFillerWords, smartEvaluate } from "../services/smartEvaluator.js";
import { getReferenceAnswer, parseReferenceAnswers } from "../utils/referenceAnswers.js";
import { evaluateInterviewAnswer } from "../services/aiEvaluationService.js";

const CLOSURE_Q = "What is a closure in JavaScript?";
const GOOD_CLOSURE =
  "A closure is a function that keeps access to variables from its outer lexical scope even after the outer function has returned. For example a counter factory returns an inner function that increments a private count variable. Closures are used for data privacy, memoization and callbacks.";

const CONFLICT_Q =
  "Tell me about a time when you resolved a conflict between team members during a high-pressure deadline. What actions did you take and what was the outcome?";
const GOOD_STAR =
  "In my final year project, two teammates disagreed about the database design two weeks before our deadline. As the team lead, my responsibility was to keep us on schedule. I scheduled a short meeting, asked each of them to explain their approach and listed the trade-offs. We decided to use the simpler schema and I split the remaining work into smaller tasks. As a result we delivered the project on time and got an A grade, and I learned to address disagreements early.";

test("a correct, well-explained technical answer scores highly (regression: old engine capped at 2/10)", () => {
  const result = smartEvaluate(CLOSURE_Q, GOOD_CLOSURE, "technical");
  assert.ok(result.score >= 7, `expected >= 7, got ${result.score}`);
  assert.equal(result.criteria.length, 5);
});

test("an off-topic answer scores very low", () => {
  const result = smartEvaluate(
    CLOSURE_Q,
    "I like playing cricket on weekends with my friends and we usually win the matches because we practice a lot.",
    "technical"
  );
  assert.ok(result.score <= 2, `expected <= 2, got ${result.score}`);
  assert.match(result.weaknesses, /does not address the question/i);
});

test("very short answers are capped", () => {
  const result = smartEvaluate(CLOSURE_Q, "A closure is a function.", "technical");
  assert.ok(result.score <= 2);
});

test("a full STAR answer scores well and an incomplete one names the missing parts", () => {
  const good = smartEvaluate(CONFLICT_Q, GOOD_STAR, "behavioral");
  assert.ok(good.score >= 7.5, `expected >= 7.5, got ${good.score}`);
  assert.deepEqual(good.missingStarParts, []);

  const partial = analyzeAnswer({
    question: CONFLICT_Q,
    answer:
      "Two teammates on my project were arguing about the design and the deadline was close. I scheduled a meeting with both of them and we discussed the options together until everyone agreed.",
    category: "behavioral",
  });
  assert.ok(partial.missingStarParts.includes("Result"));
});

test("filler words are detected and reported", () => {
  const filler = detectFillerWords("Um, basically it's like, you know, basically a function.");
  assert.ok(filler.count >= 4);
  const result = smartEvaluate(
    CLOSURE_Q,
    "um basically closure is like you know a function thing basically that um keeps the outer variables",
    "technical"
  );
  assert.ok(result.score <= 4);
  assert.match(result.weaknesses, /filler words/i);
});

test("reference answers are parsed from topic markdown and used to find missing concepts", () => {
  const entries = parseReferenceAnswers(
    "### What is hoisting?\n\nHoisting moves variable and function declarations to the top of their scope before execution.\n\n[[↑] Back to top](#top)\n"
  );
  assert.equal(entries.length, 1);
  assert.match(entries[0].answer, /declarations to the top/);

  const reference = getReferenceAnswer("What is Scope in JavaScript?");
  assert.ok(reference.length > 40, "bundled reference answer should exist");

  const result = smartEvaluate(
    "What is Scope in JavaScript?",
    "Scope decides where a variable can be used in the program. It is important for writing correct code and avoiding bugs in bigger programs.",
    "technical",
    { referenceAnswer: reference }
  );
  assert.ok(result.missingConcepts.length > 0);
});

test("evaluateInterviewAnswer works without a database or AI key and returns the detailed fields", async () => {
  const evaluation = await evaluateInterviewAnswer({
    question: "What is Scope in JavaScript?",
    answer:
      "Scope is the set of rules that decides where a variable can be accessed. Each function creates its own scope and nested functions can read variables from outer scopes. For example a variable declared inside a function is not visible outside it, and let and const add block scope.",
    category: "technical",
  });

  assert.equal(evaluation.source, "smart-evaluator");
  assert.ok(evaluation.score >= 7, `expected >= 7, got ${evaluation.score}`);
  assert.ok(Array.isArray(evaluation.criteria) && evaluation.criteria.length === 5);
  assert.ok(evaluation.referenceAnswer);
  assert.ok(typeof evaluation.fillerWords?.count === "number");
});
