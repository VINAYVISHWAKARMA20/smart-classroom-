import Membership from "../models/Membership.js";

export function registerNotificationSocket(io, socket) {
  // When a user connects, auto-join them to all their classroom rooms
  socket.on("notifications:subscribe", async (_, cb) => {
    try {
      const memberships = await Membership.find({ userId: socket.user.id }).lean();
      for (const m of memberships) {
        socket.join(`classroom:${m.classroomId}`);
      }
      cb?.({ ok: true });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });
}

// Helper to emit notifications from route handlers
export function emitNotification(io, classroomId, payload) {
  io.to(`classroom:${classroomId}`).emit("notification", payload);
}
