import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

export async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing token"));

    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return next(new Error("User not found"));

    socket.user = { id: user._id.toString(), role: user.role, name: user.name };
    next();
  } catch {
    next(new Error("Invalid token"));
  }
}
