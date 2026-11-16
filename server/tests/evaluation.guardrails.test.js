import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyEvaluationGuardrails,
  getEvaluationRiskSignals,
} from "../services/evaluationGuardrails.js";

test("guardrail caps score for too-short answers", () => {
  const result = applyEvaluationGuardrails(
    {
      score: 8,
      weaknesses: "",
      improvement: "",
      overall_feedback: "",
    },
    {
      question: "What is the difference between a Choice and a List in Swing?",
      answer: "Not sure",
      expectedKeywords: ["choice", "list", "selection"],
    }
  );

  assert.equal(result.score, 2);
  assert.match(result.weaknesses, /too short/i);
});

test("guardrail caps score for off-topic short answers", () => {
  const result = applyEvaluationGuardrails(
    {
      score: 7,
      weaknesses: "",
      improvement: "",
      overall_feedback: "",
    },
    {
      question: "Explain how HashMap handles collisions in Java.",
      answer: "I enjoy football and music and travel on weekends.",
      expectedKeywords: ["hash", "bucket", "collision"],
    }
  );

  assert.equal(result.score, 3);
  assert.match(result.weaknesses, /off-topic/i);
});

test("guardrail keeps relevant answers unchanged", () => {
  const result = applyEvaluationGuardrails(
    {
      score: 8,
      weaknesses: "Could compare tradeoffs more clearly.",
      improvement: "Add a brief collision example.",
      overall_feedback: "Strong and relevant response.",
    },
    {
      question: "Explain how HashMap handles collisions in Java.",
      answer:
        "HashMap stores entries in buckets and handles collisions with linked structures. When keys collide, Java compares hash and equals and can use tree bins for dense buckets.",
      expectedKeywords: ["hash", "bucket", "collision", "equals"],
    }
  );

  assert.equal(result.score, 8);
  assert.equal(result.overall_feedback, "Strong and relevant response.");
});

test("risk signal detects gibberish responses", () => {
  const signals = getEvaluationRiskSignals({
    question: "What is polymorphism in Java?",
    answer: "vyhjlc yhvvo trrkkk qwrty",
    expectedKeywords: ["inheritance", "override"],
  });

  assert.equal(signals.gibberish, true);
});
