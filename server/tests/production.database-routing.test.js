import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";

// Simulates the Vercel deployment with MongoDB unavailable (no MONGO_URI).
let server;
let baseUrl;

before(async () => {
  process.env.VERCEL = "1";
  delete process.env.MONGO_URI;
  delete process.env.MONGODB_URI;
  process.env.LOG_HTTP_REQUESTS = "false";

  const { default: app } = await import("../app.js");
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("question routes keep working when the database is down", async () => {
  const res = await fetch(`${baseUrl}/api/questions?category=technical&count=2`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.questions.length, 2);
});

test("auth routes report the database problem with a reason", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com", password: "abc12345" }),
  });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.error.code, "DATABASE_UNAVAILABLE");
  assert.equal(body.error.reason, "DATABASE_NOT_CONFIGURED");
});

test("saving practice sessions still requires the database", async () => {
  const res = await fetch(`${baseUrl}/api/practice/sessions/me`);
  assert.equal(res.status, 503);
});
