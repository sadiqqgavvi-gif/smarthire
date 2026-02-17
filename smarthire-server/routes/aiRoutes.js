import express from "express";
import { evaluateInterview } from "../controllers/aiController.js";
import { validateAiEvaluationPayload } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post("/evaluate", validateAiEvaluationPayload, evaluateInterview);

export default router;
