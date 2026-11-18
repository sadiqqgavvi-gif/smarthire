import { logError } from "./logger.js";

export const notFound = (req, res) => {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  const requestId = res.locals?.requestId;
  res.status(404).json({
    success: false,
    ...(requestId ? { requestId } : {}),
    message,
    error: {
      code: "NOT_FOUND",
      message,
    },
  });
};

// Errors raised by express.json() before a route runs (see body-parser's `type` values).
const BODY_PARSER_ERRORS = {
  "entity.parse.failed": {
    status: 400,
    code: "INVALID_JSON",
    message: "The request body is not valid JSON.",
  },
  "entity.too.large": {
    status: 413,
    code: "PAYLOAD_TOO_LARGE",
    message: "The request is too large. Please shorten your answer and try again.",
  },
};

export const errorHandler = (err, req, res, _next) => {
  const requestId = res.locals?.requestId;
  const isCorsError = typeof err?.message === "string" && err.message.startsWith("Blocked by CORS:");
  const parserError = BODY_PARSER_ERRORS[err?.type];

  let status = Number(err?.status || err?.statusCode) || (res.statusCode !== 200 ? res.statusCode : 500);
  let code = err?.code || "INTERNAL_SERVER_ERROR";
  let message = err?.message || "Something went wrong";

  if (parserError) {
    ({ status, code, message } = parserError);
  } else if (isCorsError) {
    status = 403;
    code = "CORS_BLOCKED";
  }

  if (status < 400 || status > 599) status = 500;

  if (status >= 500) {
    // Internal details (database, library errors) stay in the server log, not the response.
    logError("unhandled_error", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      error: err?.stack || String(err),
    });
    code = "INTERNAL_SERVER_ERROR";
    message = "Something went wrong on our side. Please try again.";
  }

  res.status(status).json({
    success: false,
    ...(requestId ? { requestId } : {}),
    message,
    error: { code, message },
  });
};
