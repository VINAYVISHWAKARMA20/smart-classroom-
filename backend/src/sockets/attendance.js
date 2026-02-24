import LiveSession from "../models/LiveSession.js";
import { requireMember } from "../services/join.service.js";
import { markJoin, markLeave } from "../services/attendance.service.js";

export function registerAttendanceSocket(io, socket) {
  socket.on("attendance:join", async ({ sessionId }, cb) => {
    try {
      const session = await LiveSession.findById(sessionId).lean();
      if (!session || session.status !== "active") throw new Error("Session not active");

      const m = await requireMember(session.classroomId.toString(), socket.user.id);
      if (!m) throw new Error("Not a member");

      socket.data.activeSessionId = sessionId;

      const { attendance } = await markJoin({ sessionId, userId: socket.user.id });
      cb?.({ ok: true, attendance });

      io.to(`session:${sessionId}`).emit("attendance:update", { userId: socket.user.id, status: attendance.status, totalMs: attendance.totalMs });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on("attendance:leave", async ({ sessionId }, cb) => {
    try {
      const doc = await markLeave({ sessionId, userId: socket.user.id });
      cb?.({ ok: true, attendance: doc });
      io.to(`session:${sessionId}`).emit("attendance:update", { userId: socket.user.id, status: doc?.status, totalMs: doc?.totalMs });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on("disconnect", async () => {
    const sessionId = socket.data.activeSessionId;
    if (sessionId) {
      await markLeave({ sessionId, userId: socket.user.id });
      io.to(`session:${sessionId}`).emit("attendance:update", { userId: socket.user.id });
    }
  });
}
