import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173"
};
