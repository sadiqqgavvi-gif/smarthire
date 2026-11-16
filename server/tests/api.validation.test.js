import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";
import app from "../app.js";

let server;
let baseUrl;

const requestJson = async (path, { method = "GET", body, headers = {} } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { response, json, text };
};

before(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
  process.env.LOG_HTTP_REQUESTS = "false";

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (!server) return;

  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

test("GET / returns backend status message", async () => {
  const { response, text } = await requestJson("/");

  assert.equal(response.status, 200);
  assert.match(text, /SmartHire Backend Running/i);
  assert.ok(response.headers.get("x-request-id"));
});

test("GET /health/live returns service liveness", async () => {
  const { response, json } = await requestJson("/health/live");

  assert.equal(response.status, 200);
  assert.equal(json?.success, true);
  assert.equal(json?.check, "live");
  assert.ok(json?.requestId);
});

test("GET /health/ready returns 503 when database is not connected in app-only tests", async () => {
  const { response, json } = await requestJson("/health/ready");

  assert.equal(response.status, 503);
  assert.equal(json?.success, false);
  assert.equal(json?.error?.code, "SERVICE_NOT_READY");
  assert.ok(json?.requestId);
});

test("GET /api/questions without category returns validation error", async () => {
  const { response, json } = await requestJson("/api/questions");

  assert.equal(response.status, 400);
  assert.equal(json?.success, false);
  assert.equal(json?.message, "Category is required");
  assert.equal(json?.error?.code, "VALIDATION_ERROR");
  assert.ok(json?.requestId);
});

test("POST /api/ai/evaluate without question returns validation error", async () => {
  const { response, json } = await requestJson("/api/ai/evaluate", {
    method: "POST",
    body: {
      answer: "This is my answer",
      category: "behavioral",
    },
  });

  assert.equal(response.status, 400);
  assert.equal(json?.success, false);
  assert.equal(json?.error?.field, "question");
  assert.equal(json?.error?.code, "VALIDATION_ERROR");
  assert.ok(json?.requestId);
});

test("POST /api/mock/evaluate without answer returns validation error", async () => {
  const { response, json } = await requestJson("/api/mock/evaluate", {
    method: "POST",
    body: {
      question: "Tell me about a challenge.",
      category: "behavioral",
    },
  });

  assert.equal(response.status, 400);
  assert.equal(json?.success, false);
  assert.equal(json?.error?.field, "answer");
  assert.equal(json?.error?.code, "VALIDATION_ERROR");
  assert.ok(json?.requestId);
});

test("POST /api/practice/sessions without token returns unauthorized", async () => {
  const { response, json } = await requestJson("/api/practice/sessions", {
    method: "POST",
    body: {
      mode: "practice",
      category: "technical",
      difficulty: "easy",
      questionCount: 3,
      attemptedCount: 0,
      averageScore: 0,
    },
  });

  assert.equal(response.status, 401);
  assert.equal(json?.message, "Not authorized, token missing");
  assert.equal(json?.error?.code, "AUTH_TOKEN_MISSING");
  assert.ok(json?.requestId);
});

test("POST /api/auth/register with invalid email returns validation error", async () => {
  const { response, json } = await requestJson("/api/auth/register", {
    method: "POST",
    body: {
      email: "invalid-email",
      password: "123456",
    },
  });

  assert.equal(response.status, 400);
  assert.equal(json?.success, false);
  assert.equal(json?.error?.field, "email");
});

test("POST /api/contact with short message returns validation error", async () => {
  const { response, json } = await requestJson("/api/contact", {
    method: "POST",
    body: {
      name: "Ali",
      email: "ali@example.com",
      message: "hi",
    },
  });

  assert.equal(response.status, 400);
  assert.equal(json?.success, false);
  assert.equal(json?.error?.field, "message");
});

test("GET /api/ai/python-health returns diagnostics payload", async () => {
  const { response, json } = await requestJson("/api/ai/python-health");

  assert.equal(response.status, 200);
  assert.equal(json?.success, true);
  assert.ok(typeof json?.enabled === "boolean");
  assert.ok(typeof json?.scriptExists === "boolean");
  assert.ok(typeof json?.pythonBin === "string");
});
