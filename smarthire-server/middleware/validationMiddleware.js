const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendValidationError = (res, message, field) =>
  res.status(400).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message,
      field,
    },
  });

export const validateAuthPayload = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string") {
    return sendValidationError(res, "Email is required", "email");
  }

  if (!emailRegex.test(email.trim().toLowerCase())) {
    return sendValidationError(res, "Email format is invalid", "email");
  }

  if (!password || typeof password !== "string") {
    return sendValidationError(res, "Password is required", "password");
  }

  if (password.length < 6) {
    return sendValidationError(
      res,
      "Password must be at least 6 characters",
      "password"
    );
  }

  return next();
};

export const validateContactPayload = (req, res, next) => {
  const { name, email, message } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return sendValidationError(res, "Name is required", "name");
  }

  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    return sendValidationError(res, "Valid email is required", "email");
  }

  if (!message || typeof message !== "string" || message.trim().length < 5) {
    return sendValidationError(res, "Message is too short", "message");
  }

  return next();
};

export const validateAiEvaluationPayload = (req, res, next) => {
  const { answer } = req.body || {};

  if (!answer || typeof answer !== "string" || !answer.trim()) {
    return sendValidationError(res, "Answer is required", "answer");
  }

  return next();
};

export const validateMockEvaluationPayload = (req, res, next) => {
  const { question, answer } = req.body || {};

  if (!question || typeof question !== "string" || !question.trim()) {
    return sendValidationError(res, "Question is required", "question");
  }

  if (!answer || typeof answer !== "string" || !answer.trim()) {
    return sendValidationError(res, "Answer is required", "answer");
  }

  return next();
};

export const validatePracticeSessionPayload = (req, res, next) => {
  const {
    mode = "practice",
    category,
    difficulty = "",
    questionCount = 0,
    attemptedCount = 0,
    averageScore = 0,
  } = req.body || {};

  const allowedModes = new Set(["practice", "mock"]);
  const allowedDifficulties = new Set(["", "easy", "medium", "hard", "mixed"]);

  if (!category || typeof category !== "string") {
    return sendValidationError(res, "Category is required", "category");
  }

  if (!allowedModes.has(String(mode).toLowerCase())) {
    return sendValidationError(res, "Mode must be practice or mock", "mode");
  }

  if (!allowedDifficulties.has(String(difficulty).toLowerCase())) {
    return sendValidationError(
      res,
      "Difficulty must be easy, medium, hard, mixed, or empty",
      "difficulty"
    );
  }

  if (!Number.isFinite(Number(questionCount)) || Number(questionCount) < 0) {
    return sendValidationError(res, "questionCount must be >= 0", "questionCount");
  }

  if (!Number.isFinite(Number(attemptedCount)) || Number(attemptedCount) < 0) {
    return sendValidationError(
      res,
      "attemptedCount must be >= 0",
      "attemptedCount"
    );
  }

  if (
    !Number.isFinite(Number(averageScore)) ||
    Number(averageScore) < 0 ||
    Number(averageScore) > 10
  ) {
    return sendValidationError(
      res,
      "averageScore must be between 0 and 10",
      "averageScore"
    );
  }

  return next();
};
