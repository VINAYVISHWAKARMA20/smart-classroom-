import { Server } from "socket.io";
import { env } from "../config/env.js";
import { socketAuthMiddleware } from "./authSocket.js";
import { registerSignaling } from "./signaling.js";
import { registerAttendanceSocket } from "./attendance.js";
import { registerNotificationSocket } from "./notifications.js";

let ioInstance = null;

export function getIO() { return ioInstance; }

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true }
  });

  ioInstance = io;
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    registerSignaling(io, socket);
    registerAttendanceSocket(io, socket);
    registerNotificationSocket(io, socket);
  });

  console.log("Socket.io ready");
}
