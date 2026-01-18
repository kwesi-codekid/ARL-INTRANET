import mongoose from "mongoose";

/**
 * Global cache for Mongoose connection (HMR support in development)
 */
declare global {
  var __mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

/**
 * Cached connection for serverless/SSR environments
 */
let cached = global.__mongooseConnection;

if (!cached) {
  cached = global.__mongooseConnection = { conn: null, promise: null };
}

/**
 * Connection options for MongoDB
 */
const connectionOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Connect to MongoDB with singleton pattern
 * Caches the connection for reuse in SSR/serverless environments
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("[DB] Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI!, connectionOptions).then((mongoose) => {
      console.log("[DB] Connected to MongoDB successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("[DB] MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 * Useful for graceful shutdown
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("[DB] Disconnected from MongoDB");
  }
}

/**
 * Get connection status
 */
export function getConnectionStatus(): string {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
}

export { mongoose };
