import express from "express";
import { evaluateInterview, getPythonHealth } from "../controllers/aiController.js";
import { validateAiEvaluationPayload } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.get("/python-health", getPythonHealth);
router.post("/evaluate", validateAiEvaluationPayload, evaluateInterview);

export default router;
