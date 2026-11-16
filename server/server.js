import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./utils/database.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

const start = async () => {
  try {
    await connectDatabase();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
      } finally {
        process.exit(0);
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start();
