import mongoose from "mongoose";

const MONGO_CONNECT_TIMEOUT_MS =
  Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000;

let connectionPromise;

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    const MONGO_URI =
      process.env.MONGO_URI || "mongodb://localhost:27017/smarthire";

    connectionPromise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: MONGO_CONNECT_TIMEOUT_MS,
    });
  }

  try {
    await connectionPromise;
    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
};

export const ensureDatabaseConnection = async (_req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    res.status(503).json({
      success: false,
      message: "Database connection is not available",
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Service temporarily unavailable",
      },
    });
  }
};
