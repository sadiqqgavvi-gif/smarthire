import express from "express";
import { getMockQuestions, evaluateMockAnswer } from "../controllers/mockController.js";
import { validateMockEvaluationPayload } from "../middleware/validationMiddleware.js";
import { mockEvaluationLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post(
  "/evaluate",
  mockEvaluationLimiter,
  validateMockEvaluationPayload,
  evaluateMockAnswer
);

router.get("/:category", getMockQuestions);

export default router;
