import LiveSession from "../models/LiveSession.js";
import { requireMember } from "../services/join.service.js";

export function registerSignaling(io, socket) {
  socket.on("live:joinRoom", async ({ sessionId }, cb) => {
    try {
      const session = await LiveSession.findById(sessionId).lean();
      if (!session || session.status !== "active") throw new Error("Session not active");

      const m = await requireMember(session.classroomId.toString(), socket.user.id);
      if (!m) throw new Error("Not a member");

      socket.join(`session:${sessionId}`);

      // Get existing socket IDs already in the room (excluding self)
      const room = io.sockets.adapter.rooms.get(`session:${sessionId}`);
      const peers = room ? [...room].filter(id => id !== socket.id) : [];

      cb?.({ ok: true, teacherId: session.teacherId.toString(), peers });

      // Broadcast to everyone EXCEPT the sender
      socket.to(`session:${sessionId}`).emit("live:peerJoined", { userId: socket.user.id, socketId: socket.id });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on("webrtc:offer", ({ toSocketId, offer, sessionId }) => {
    io.to(toSocketId).emit("webrtc:offer", { fromSocketId: socket.id, offer, sessionId });
  });

  socket.on("webrtc:answer", ({ toSocketId, answer, sessionId }) => {
    io.to(toSocketId).emit("webrtc:answer", { fromSocketId: socket.id, answer, sessionId });
  });

  socket.on("webrtc:ice", ({ toSocketId, candidate, sessionId }) => {
    io.to(toSocketId).emit("webrtc:ice", { fromSocketId: socket.id, candidate, sessionId });
  });
}
