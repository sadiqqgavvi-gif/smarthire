import mongoose from "mongoose";

const MONGO_CONNECT_TIMEOUT_MS =
  Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000;

const LOCAL_MONGO_URI = "mongodb://localhost:27017/smarthire";

let connectionPromise;
let lastConnectionError = null;
let lastFailureAt = 0;
const OPTIONAL_RETRY_COOLDOWN_MS = 30 * 1000;

const isHostedRuntime = () =>
  Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

const resolveMongoUri = () => {
  const uri = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();
  if (uri) return uri;

  // A hosted deployment can never reach "localhost", so fail fast with a clear reason
  // instead of waiting for a connection timeout.
  if (isHostedRuntime()) return "";

  return LOCAL_MONGO_URI;
};

/**
 * Turns a raw MongoDB/Mongoose error into a short, secret-free explanation
 * that tells the developer what to fix in their deployment settings.
 */
export const describeDatabaseError = (error) => {
  if (!error) return null;

  if (error.code === "MONGO_URI_MISSING") {
    return {
      code: "DATABASE_NOT_CONFIGURED",
      hint: "MONGO_URI environment variable is not set on the server.",
    };
  }

  const text = `${error.name || ""} ${error.message || ""}`.toLowerCase();
  const networkCode = extractNetworkCode(error);

  // mongodb+srv:// URIs need a DNS SRV lookup first. A missing record means the
  // cluster hostname is wrong or the cluster was deleted.
  if (text.includes("querysrv") || text.includes("querytxt")) {
    if (networkCode === "ENOTFOUND" || networkCode === "ENODATA") {
      return {
        code: "DATABASE_HOST_NOT_FOUND",
        detail: networkCode,
        hint: "The cluster hostname in MONGO_URI does not exist. The Atlas cluster may have been deleted or renamed: copy a fresh connection string from Atlas > Connect > Drivers.",
      };
    }

    return {
      code: "DATABASE_DNS_FAILED",
      detail: networkCode || error.name,
      hint: "DNS lookup for the mongodb+srv:// address failed. Retry, or use the standard (non-SRV) connection string from Atlas.",
    };
  }

  if (text.includes("auth") && (text.includes("fail") || text.includes("bad"))) {
    return {
      code: "DATABASE_AUTH_FAILED",
      hint: "MongoDB rejected the username/password in MONGO_URI. Check the database user credentials (URL-encode special characters in the password).",
    };
  }

  if (
    error.name === "MongoParseError" ||
    text.includes("invalid scheme") ||
    text.includes("openuri()")
  ) {
    return {
      code: "DATABASE_URI_INVALID",
      hint: "MONGO_URI is not a valid MongoDB connection string.",
    };
  }

  if (
    text.includes("serverselection") ||
    text.includes("timed out") ||
    text.includes("whitelist") ||
    text.includes("enotfound") ||
    text.includes("econnrefused")
  ) {
    return {
      code: "DATABASE_UNREACHABLE",
      detail: networkCode || error.name || "",
      hint: "The MongoDB cluster could not be reached. In MongoDB Atlas > Network Access, allow 0.0.0.0/0 (serverless hosts have changing IPs) and make sure the cluster is not paused.",
    };
  }

  return {
    code: "DATABASE_UNAVAILABLE",
    detail: networkCode || error.name || "",
    hint: "MongoDB connection failed. Check the server logs for details.",
  };
};

const NETWORK_CODE_PATTERN = /\b(E[A-Z]{3,})\b/;

// Pulls a network error code (ENOTFOUND, ECONNREFUSED, ...) out of an error or its causes.
const extractNetworkCode = (error, depth = 0) => {
  if (!error || depth > 3) return "";
  if (typeof error.code === "string" && NETWORK_CODE_PATTERN.test(error.code)) {
    return error.code;
  }

  const fromMessage = String(error.message || "").match(NETWORK_CODE_PATTERN);
  if (fromMessage) return fromMessage[1];

  const serverErrors = error.reason?.servers
    ? [...error.reason.servers.values()].map((server) => server?.error)
    : [];

  for (const nested of [error.cause, ...serverErrors]) {
    const code = extractNetworkCode(nested, depth + 1);
    if (code) return code;
  }

  return "";
};

export const getLastDatabaseError = () => describeDatabaseError(lastConnectionError);

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export const isMongoUriConfigured = () =>
  Boolean((process.env.MONGO_URI || process.env.MONGODB_URI || "").trim());

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    const mongoUri = resolveMongoUri();

    if (!mongoUri) {
      const error = new Error("MONGO_URI is not configured");
      error.code = "MONGO_URI_MISSING";
      lastConnectionError = error;
      lastFailureAt = Date.now();
      throw error;
    }

    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: MONGO_CONNECT_TIMEOUT_MS,
    });
  }

  try {
    await connectionPromise;
    lastConnectionError = null;
    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    lastConnectionError = error;
    lastFailureAt = Date.now();
    throw error;
  }
};

// For routes that can still answer without MongoDB (for example questions served
// from the bundled markdown files): try to connect, but never block the request.
export const tryDatabaseConnection = async (_req, _res, next) => {
  // After a recent failure, answer from the fallback straight away instead of
  // making every request wait for another connection timeout.
  if (!isDatabaseConnected() && Date.now() - lastFailureAt < OPTIONAL_RETRY_COOLDOWN_MS) {
    return next();
  }

  try {
    await connectDatabase();
  } catch (error) {
    const details = describeDatabaseError(error);
    console.warn(`MongoDB unavailable, using fallback [${details.code}]`);
  }
  next();
};

export const ensureDatabaseConnection = async (_req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    const details = describeDatabaseError(error);
    console.error(
      `MongoDB connection failed [${details.code}]: ${details.hint}`,
      error?.message || error
    );

    const requestId = res.locals?.requestId;
    res.status(503).json({
      success: false,
      ...(requestId ? { requestId } : {}),
      message: "Database connection is not available",
      error: {
        code: "DATABASE_UNAVAILABLE",
        reason: details.code,
        message: "Service temporarily unavailable",
      },
    });
  }
};
