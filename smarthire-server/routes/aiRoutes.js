import express from "express";
import { evaluateInterview } from "../controllers/aiController.js";

const router = express.Router();

router.post("/evaluate", evaluateInterview);

export default router;
