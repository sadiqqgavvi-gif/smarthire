import rateLimit from "express-rate-limit";

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message,
      },
    },
  });

const baseWindowMs = toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const baseMax = toNumber(process.env.RATE_LIMIT_MAX, 250);

const authMax = toNumber(process.env.AUTH_RATE_LIMIT_MAX, 40);
const aiMax = toNumber(process.env.AI_RATE_LIMIT_MAX, 20);
const mockEvalMax = toNumber(process.env.MOCK_EVAL_RATE_LIMIT_MAX, 25);

export const apiLimiter = buildLimiter({
  windowMs: baseWindowMs,
  max: baseMax,
  message: "Too many requests. Please try again shortly.",
});

export const authLimiter = buildLimiter({
  windowMs: baseWindowMs,
  max: authMax,
  message: "Too many authentication attempts. Please try again shortly.",
});

export const aiLimiter = buildLimiter({
  windowMs: baseWindowMs,
  max: aiMax,
  message: "Too many AI evaluation requests. Please wait and retry.",
});

export const mockEvaluationLimiter = buildLimiter({
  windowMs: baseWindowMs,
  max: mockEvalMax,
  message: "Too many mock evaluation requests. Please wait and retry.",
});

