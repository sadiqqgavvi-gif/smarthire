import express from "express";
import { getMockQuestions, evaluateMockAnswer } from "../controllers/mockController.js";
import { validateMockEvaluationPayload } from "../middleware/validationMiddleware.js";

const router = express.Router();

// ⚠ IMPORTANT: Put STATIC route FIRST
router.post("/evaluate", validateMockEvaluationPayload, evaluateMockAnswer);

// Then dynamic route
router.get("/:category", getMockQuestions);

export default router;
