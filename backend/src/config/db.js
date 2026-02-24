import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  if (!env.MONGO_URI) throw new Error("Missing MONGO_URI");
  await mongoose.connect(env.MONGO_URI);
  console.log("âœ… MongoDB connected");
}
