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

test("SRV lookups for a deleted or mistyped cluster are reported as host not found", () => {
  const error = new Error("querySrv ENOTFOUND _mongodb._tcp.cluster0.abcde.mongodb.net");
  error.code = "ENOTFOUND";
  const details = describeDatabaseError(error);
  assert.equal(details.code, "DATABASE_HOST_NOT_FOUND");
  assert.equal(details.detail, "ENOTFOUND");
});

test("other SRV DNS failures are reported as DNS problems", () => {
  const error = new Error("querySrv ECONNREFUSED _mongodb._tcp.cluster0.abcde.mongodb.net");
  assert.equal(describeDatabaseError(error).code, "DATABASE_DNS_FAILED");
});

test("the unreachable hint matches the target: local service vs Atlas dashboard", () => {
  const error = new Error("connect ECONNREFUSED 127.0.0.1:27017");
  error.name = "MongooseServerSelectionError";
  const original = process.env.MONGO_URI;

  try {
    process.env.MONGO_URI = "mongodb://127.0.0.1:27017/smarthire";
    const local = describeDatabaseError(error);
    assert.equal(local.code, "DATABASE_UNREACHABLE");
    assert.match(local.hint, /local MongoDB service/i);
    assert.doesNotMatch(local.hint, /Network Access/i);

    process.env.MONGO_URI = "mongodb+srv://user:pw@cluster1122.hraevyv.mongodb.net/smarthire";
    const hosted = describeDatabaseError(error);
    assert.match(hosted.hint, /Network Access/i);
  } finally {
    if (original === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = original;
  }
});
