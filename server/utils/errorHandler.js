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

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const isCorsError = typeof err?.message === "string" && err.message.startsWith("Blocked by CORS:");
  const finalStatus = isCorsError ? 403 : statusCode;
  const requestId = res.locals?.requestId;

  res.status(finalStatus).json({
    success: false,
    ...(requestId ? { requestId } : {}),
    message: err?.message || "Something went wrong",
    error: {
      code: isCorsError ? "CORS_BLOCKED" : err?.code || "INTERNAL_SERVER_ERROR",
      message: err?.message || "Something went wrong",
    },
  });
};
