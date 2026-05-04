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
import { ensureDatabaseConnection } from "./utils/database.js";
import {
  attachRequestContext,
  logHttpRequest,
} from "./middleware/observabilityMiddleware.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
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

app.get("/health/ready", (_req, res) => {
  const requestId = res.locals?.requestId;
  const dbReady = mongoose.connection.readyState === 1;

  if (!dbReady) {
    return res.status(503).json({
      success: false,
      ...(requestId ? { requestId } : {}),
      message: "Service not ready",
      error: {
        code: "SERVICE_NOT_READY",
        message: "MongoDB connection is not ready",
      },
      checks: {
        mongodb: "down",
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
    },
    timestamp: new Date().toISOString(),
  });
});

if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  app.use("/api", ensureDatabaseConnection);
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
