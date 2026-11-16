import express from "express";
import { submitContactForm } from "../controllers/contactController.js";
import { validateContactPayload } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post("/", validateContactPayload, submitContactForm);

export default router;
