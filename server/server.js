import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase, describeDatabaseError } from "./utils/database.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

const start = async () => {
  // Starting without MongoDB is supported: question and evaluation routes fall back to the
  // bundled question bank, and /health/ready reports why the database is unavailable. This
  // matches the deployed behaviour, where each request reconnects on demand.
  try {
    await connectDatabase();
    console.log("MongoDB connected");
  } catch (err) {
    const { hint } = describeDatabaseError(err);
    console.warn(
      [
        "",
        "Starting without a database connection.",
        `  ${hint}`,
        "",
        "  Working:     practice and mock interview questions, answer evaluation.",
        "  Unavailable: sign-up, login, saving sessions and the dashboard.",
        "",
      ].join("\n")
    );
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
