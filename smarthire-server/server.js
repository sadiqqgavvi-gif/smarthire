import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import questionRoutes from "./routes/questionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import practiceRoutes from "./routes/practiceRoutes.js";
import mockRoutes from "./routes/mockRoutes.js";
import { notFound, errorHandler } from "./utils/errorHandler.js";

dotenv.config();
const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

  
// --- CORS setup ---
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Blocked by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// --- Middleware ---
app.use(express.json());

app.use("/api/mock", mockRoutes);

// --- Routes ---
app.use("/api/practice", practiceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/questions", questionRoutes); // ✅ Mount questionRoutes here



// --- MongoDB connection ---
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/smarthire")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Root route ---
app.get("/", (req, res) => res.send("SmartHire Backend Running ✅"));

app.use(notFound);
app.use(errorHandler);

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
