import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/User.js";

let server;
let baseUrl;

const usersById = new Map();
const usersByEmail = new Map();
let idCounter = 0;

const makeId = () => `user_${++idCounter}`;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const cloneUser = (user) => ({
  _id: user._id,
  email: user.email,
  name: user.name || "",
  password: user.password ?? null,
  authProvider: user.authProvider || "local",
  googleId: user.googleId ?? null,
  avatarUrl: user.avatarUrl || "",
  role: user.role || "user",
  permissions: user.permissions || [],
  refreshTokenHash: user.refreshTokenHash ?? null,
});

const makeSelectedDoc = (raw) => {
  if (!raw) return null;

  const doc = cloneUser(raw);
  doc.save = async () => {
    usersById.set(String(doc._id), cloneUser(doc));
    usersByEmail.set(String(doc.email).toLowerCase(), cloneUser(doc));
    return doc;
  };
  return doc;
};

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

const originalPrototypeSave = User.prototype.save;
const originalFindOne = User.findOne;
const originalFindById = User.findById;
const originalFindByIdAndUpdate = User.findByIdAndUpdate;

before(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
  process.env.ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
  process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  process.env.LOG_HTTP_REQUESTS = "false";

  User.prototype.save = async function saveMock() {
    if (!this._id) this._id = makeId();
    if (!this.role) this.role = "user";
    if (!Array.isArray(this.permissions)) this.permissions = [];

    const plain = cloneUser(this);
    usersById.set(String(plain._id), plain);
    usersByEmail.set(String(plain.email).toLowerCase(), plain);
    return this;
  };

  User.findOne = async (query = {}) => {
    const email = String(query.email || "").toLowerCase();
    const user = usersByEmail.get(email);
    return user ? makeSelectedDoc(user) : null;
  };

  User.findById = (id) => ({
    select: async () => {
      const user = usersById.get(String(id));
      return user ? makeSelectedDoc(user) : null;
    },
  });

  User.findByIdAndUpdate = async (id, update = {}) => {
    const existing = usersById.get(String(id));
    if (!existing) return null;
    const merged = { ...existing, ...update };
    usersById.set(String(id), cloneUser(merged));
    usersByEmail.set(String(merged.email).toLowerCase(), cloneUser(merged));
    return makeSelectedDoc(merged);
  };

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  User.prototype.save = originalPrototypeSave;
  User.findOne = originalFindOne;
  User.findById = originalFindById;
  User.findByIdAndUpdate = originalFindByIdAndUpdate;

  usersById.clear();
  usersByEmail.clear();

  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

test("auth happy path: register -> login -> me -> refresh -> logout", async () => {
  const email = "flow@example.com";
  const password = "abc12345";

  const registerRes = await requestJson("/api/auth/register", {
    method: "POST",
    body: { email, password },
  });

  assert.equal(registerRes.response.status, 200);
  assert.equal(registerRes.json?.message, "Registration successful");
  assert.equal(registerRes.json?.user?.email, email);
  assert.ok(registerRes.json?.requestId);

  const loginRes = await requestJson("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  assert.equal(loginRes.response.status, 200);
  assert.equal(loginRes.json?.message, "Login successful");
  assert.ok(loginRes.json?.requestId);

  const userId = String(loginRes.json?.user?.id);
  assert.ok(userId);

  const accessToken = jwt.sign(
    { id: userId, role: "user", permissions: [] },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const meRes = await requestJson("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  assert.equal(meRes.response.status, 200);
  assert.equal(String(meRes.json?.user?.id), userId);
  assert.equal(meRes.json?.user?.email, email);
  assert.ok(meRes.json?.requestId);

  const refreshToken = jwt.sign(
    { id: userId, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  const storedUser = usersById.get(userId);
  storedUser.refreshTokenHash = hashToken(refreshToken);
  usersById.set(userId, cloneUser(storedUser));
  usersByEmail.set(String(storedUser.email).toLowerCase(), cloneUser(storedUser));

  const refreshRes = await requestJson("/api/auth/refresh", {
    method: "POST",
    headers: {
      Cookie: `refreshToken=${encodeURIComponent(refreshToken)}`,
    },
  });

  assert.equal(refreshRes.response.status, 200);
  assert.equal(refreshRes.json?.message, "Session refreshed");
  assert.equal(String(refreshRes.json?.user?.id), userId);
  assert.ok(refreshRes.json?.requestId);

  const logoutRes = await requestJson("/api/auth/logout", {
    method: "POST",
    headers: {
      Cookie: `accessToken=${encodeURIComponent(accessToken)}`,
    },
  });

  assert.equal(logoutRes.response.status, 200);
  assert.equal(logoutRes.json?.message, "Logged out successfully");
  assert.ok(logoutRes.json?.requestId);

  const afterLogout = usersById.get(userId);
  assert.equal(afterLogout?.refreshTokenHash, null);
});

test("auth google login creates or reuses a verified google account", async () => {
  process.env.GOOGLE_CLIENT_ID = "google-client-id-test";

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    const asString = String(url);

    if (asString.startsWith("https://oauth2.googleapis.com/tokeninfo")) {
      return new Response(
        JSON.stringify({
          aud: process.env.GOOGLE_CLIENT_ID,
          email_verified: "true",
          email: "google.user@example.com",
          name: "Google User",
          sub: "google-sub-123",
          picture: "https://example.com/avatar.png",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return originalFetch(url, options);
  };

  try {
    const googleLoginRes = await requestJson("/api/auth/google", {
      method: "POST",
      body: { credential: "google-id-token" },
    });

    assert.equal(googleLoginRes.response.status, 200);
    assert.equal(googleLoginRes.json?.message, "Google login successful");
    assert.equal(googleLoginRes.json?.user?.email, "google.user@example.com");
    assert.equal(googleLoginRes.json?.user?.authProvider, "google");
    assert.ok(googleLoginRes.json?.requestId);

    const googleUser = usersByEmail.get("google.user@example.com");
    assert.ok(googleUser);
    assert.equal(googleUser?.googleId, "google-sub-123");
    assert.equal(googleUser?.name, "Google User");
    assert.equal(googleUser?.avatarUrl, "https://example.com/avatar.png");
  } finally {
    global.fetch = originalFetch;
  }
});
