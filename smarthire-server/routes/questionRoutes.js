import express from "express"; 
import { getQuestions } from "../controllers/questionController.js"; 
import protect from "../middleware/authMiddleware.js"; 
import Question from "../models/questionModel.js"; 
const router = express.Router(); 
/* |--------------------------------------------------------------------------
 | PUBLIC PRACTICE QUESTIONS | GET /api/questions | No auth required (recommended for FYP)
  |-------------------------------------------------------------------------- */ 
router.get("/", getQuestions); 
/* |-------------------------------------------------------------------------- 
| DEBUG ROUTE (OPTIONAL – PROTECTED) | GET /api/questions/debug | Use only for testing with token 
|-------------------------------------------------------------------------- */
 router.get("/debug", protect, async (req, res) => { console.log("📌 /api/questions/debug called with:", req.query); 
  try { const { category, difficulty, count } = req.query; const query = {};
   if (category) query.category = category; 
   if (difficulty) query.difficulty = difficulty; 
   const questions = await Question.find(query).limit(Number(count) || 10); 
   res.status(200).json(questions); } catch (err) { console.error("❌ Questions debug route failed:", err); 
    res.status(500).json({ error: "Failed to fetch questions (debug)" });
   } }); 
   
   export default router;