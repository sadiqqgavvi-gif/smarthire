export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const isCorsError = typeof err?.message === "string" && err.message.startsWith("Blocked by CORS:");
  const finalStatus = isCorsError ? 403 : statusCode;

  res.status(finalStatus).json({
    success: false,
    error: {
      code: isCorsError ? "CORS_BLOCKED" : err?.code || "INTERNAL_SERVER_ERROR",
      message: err?.message || "Something went wrong",
    },
  });
};
