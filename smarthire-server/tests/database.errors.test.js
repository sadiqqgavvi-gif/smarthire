import assert from "node:assert/strict";
import { test } from "node:test";
import { describeDatabaseError } from "../utils/database.js";

test("missing MONGO_URI is reported as not configured", () => {
  const error = new Error("MONGO_URI is not configured");
  error.code = "MONGO_URI_MISSING";
  assert.equal(describeDatabaseError(error).code, "DATABASE_NOT_CONFIGURED");
});

test("Atlas IP allow-list failures are reported as unreachable", () => {
  const error = new Error(
    "Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted. Make sure your current IP address is on your Atlas cluster's IP whitelist: https://www.mongodb.com/docs/atlas/security-whitelist/"
  );
  error.name = "MongooseServerSelectionError";
  assert.equal(describeDatabaseError(error).code, "DATABASE_UNREACHABLE");
});

test("bad credentials are reported as auth failures", () => {
  const error = new Error("bad auth : authentication failed");
  error.name = "MongoServerError";
  assert.equal(describeDatabaseError(error).code, "DATABASE_AUTH_FAILED");
});

test("malformed connection strings are reported as invalid", () => {
  const error = new Error('Invalid scheme, expected connection string to start with "mongodb://"');
  error.name = "MongoParseError";
  assert.equal(describeDatabaseError(error).code, "DATABASE_URI_INVALID");
});
