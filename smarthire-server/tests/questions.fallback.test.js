import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";
import app from "../app.js";
import Question from "../models/questionModel.js";

// MongoDB is never connected in this test, so every question route must answer
// from the bundled markdown question bank instead of failing.
let server;
let baseUrl;
const originalAggregate = Question.aggregate;
const originalCount = Question.countDocuments;

before(async () => {
  process.env.LOG_HTTP_REQUESTS = "false";
  Question.aggregate = () => {
    throw new Error("database should not be queried while disconnected");
  };
  Question.countDocuments = Question.aggregate;

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  Question.aggregate = originalAggregate;
  Question.countDocuments = originalCount;
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/questions falls back to bundled questions without a database", async () => {
  const res = await fetch(`${baseUrl}/api/questions?category=technical&difficulty=easy&count=3`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.questions.length, 3);
  assert.ok(body.questions.every((q) => q.category === "technical" && q.source === "bundled"));
});

test("GET /api/mock/:category falls back to bundled questions without a database", async () => {
  const res = await fetch(`${baseUrl}/api/mock/behavioral`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.questions.length > 0);
  assert.ok(body.questions.every((q) => q.category === "behavioral"));
});

test("GET /api/practice/:type falls back to bundled questions without a database", async () => {
  const res = await fetch(`${baseUrl}/api/practice/situational?count=2`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.questions.length, 2);
});
