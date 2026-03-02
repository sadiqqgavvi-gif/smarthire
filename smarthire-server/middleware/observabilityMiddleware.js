import { randomUUID } from "crypto";
import { logInfo } from "../utils/logger.js";

const REQUEST_ID_HEADER = "x-request-id";
const MAX_REQUEST_ID_LENGTH = 128;

const sanitizeRequestId = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_REQUEST_ID_LENGTH) return "";
  return trimmed;
};

const clientIpFromRequest = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
};

const shouldLogHttpRequests = () =>
  String(process.env.LOG_HTTP_REQUESTS || "true").toLowerCase() !== "false";

export const attachRequestContext = (req, res, next) => {
  const incomingRequestId = sanitizeRequestId(req.headers[REQUEST_ID_HEADER]);
  const requestId = incomingRequestId || randomUUID();

  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
};

export const logHttpRequest = (req, res, next) => {
  if (!shouldLogHttpRequests()) {
    return next();
  }

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logInfo("http_request", {
      requestId: res.locals.requestId || null,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: clientIpFromRequest(req),
      userAgent: req.headers["user-agent"] || "",
      userId: req.user?.id || null,
    });
  });

  next();
};

