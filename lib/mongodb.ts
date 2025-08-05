// lib/mongodb.ts
import mongoose, { Mongoose } from 'mongoose';
import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI as string;
const DB_NAME = process.env.DB_NAME || "resume";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnectMongoose(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: DB_NAME
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;

  console.log("🔥 Connected to Mongoose:", DB_NAME);

  return cached.conn;
}

export default dbConnectMongoose;
