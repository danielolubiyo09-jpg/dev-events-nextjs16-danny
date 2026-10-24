import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Cache the connection to prevent multiple connections in development
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Use global variable to persist connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using Mongoose
 * Uses connection caching to prevent multiple connections during development
 * @returns Promise<Mongoose> - The Mongoose instance
 */
async function connectDB(): Promise<Mongoose> {
  // If connection already exists, return it
  if (cached!.conn) {
    return cached!.conn;
  }

  // If no connection promise exists, create one
  if (!cached!.promise) {
    if (!MONGODB_URI) {
      throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
      );
    }

    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    // Wait for the connection promise to resolve
    cached!.conn = await cached!.promise;
  } catch (e) {
    // Reset promise on connection error to allow retry
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
