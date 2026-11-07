import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import questionRoutes from "./routes/questionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import practiceRoutes from "./routes/practiceRoutes.js";
import mockRoutes from "./routes/mockRoutes.js";
import { notFound, errorHandler } from "./utils/errorHandler.js";
import { apiLimiter, aiLimiter } from "./middleware/rateLimitMiddleware.js";
import {
  connectDatabase,
  ensureDatabaseConnection,
  getLastDatabaseError,
  isMongoUriConfigured,
  tryDatabaseConnection,
} from "./utils/database.js";
import {
  attachRequestContext,
  logHttpRequest,
} from "./middleware/observabilityMiddleware.js";

dotenv.config();

const app = express();

const isJwtSecretConfigured = () =>
  Boolean(process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);

app.set("trust proxy", 1);

const normalizeOrigin = (origin = "") => origin.trim().replace(/\/+$/, "");

const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
)
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error(`Blocked by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(attachRequestContext);
app.use(logHttpRequest);
app.use(apiLimiter);

app.get("/health/live", (_req, res) => {
  const requestId = res.locals?.requestId;
  res.status(200).json({
    success: true,
    ...(requestId ? { requestId } : {}),
    status: "ok",
    service: "smarthire-backend",
    check: "live",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/ready", async (_req, res) => {
  const requestId = res.locals?.requestId;

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    try {
      await connectDatabase();
    } catch (error) {
      console.error("MongoDB readiness check failed:", error);
    }
  }

  const dbReady = mongoose.connection.readyState === 1;

  if (!dbReady) {
    const dbError = getLastDatabaseError();
    return res.status(503).json({
      success: false,
      ...(requestId ? { requestId } : {}),
      message: "Service not ready",
      error: {
        code: "SERVICE_NOT_READY",
        message: "MongoDB connection is not ready",
        ...(dbError
          ? { reason: dbError.code, detail: dbError.detail || undefined, hint: dbError.hint }
          : {}),
      },
      checks: {
        mongodb: "down",
        mongoUriConfigured: isMongoUriConfigured(),
        jwtSecretConfigured: isJwtSecretConfigured(),
        googleClientIdConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
      },
    });
  }

  return res.status(200).json({
    success: true,
    ...(requestId ? { requestId } : {}),
    status: "ok",
    service: "smarthire-backend",
    check: "ready",
    checks: {
      mongodb: "up",
      jwtSecretConfigured: isJwtSecretConfigured(),
      googleClientIdConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
    },
    timestamp: new Date().toISOString(),
  });
});

// Routes that can still work without MongoDB: questions fall back to the bundled
// markdown question bank and AI evaluation does not touch the database.
const isDatabaseOptionalRoute = (req) => {
  const path = req.path.replace(/\/+$/, "");
  if (req.method === "GET" && path === "/questions") return true;
  if (path.startsWith("/ai/")) return true;
  if (path === "/mock/evaluate") return true;
  if (req.method === "GET" && /^\/mock\/[^/]+$/.test(path)) return true;
  if (req.method === "GET" && /^\/practice\/[^/]+$/.test(path) && path !== "/practice/sessions") {
    return true;
  }
  return false;
};

if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  app.use("/api", (req, res, next) =>
    isDatabaseOptionalRoute(req)
      ? tryDatabaseConnection(req, res, next)
      : ensureDatabaseConnection(req, res, next)
  );
}

app.use("/api/mock", mockRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/questions", questionRoutes);

app.get("/", (_req, res) => res.send("SmartHire Backend Running"));

app.use(notFound);
app.use(errorHandler);

export default app;
