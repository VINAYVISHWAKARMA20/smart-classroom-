import Attendance from "../models/Attendance.js";
import LiveSession from "../models/LiveSession.js";

const presence = new Map(); // `${sessionId}:${userId}` -> { joinedAtMs }
const makeKey = (sessionId, userId) => `${sessionId}:${userId}`;

export async function markJoin({ sessionId, userId }) {
  const session = await LiveSession.findById(sessionId).lean();
  if (!session || session.status !== "active") throw new Error("Session not active");

  const k = makeKey(sessionId, userId);
  const now = Date.now();
  if (!presence.has(k)) presence.set(k, { joinedAtMs: now });

  const doc = await Attendance.findOneAndUpdate(
    { sessionId, userId },
    {
      $setOnInsert: {
        classroomId: session.classroomId,
        firstJoinAt: new Date(),
        totalMs: 0,
        status: "pending"
      },
      $set: { lastSeenAt: new Date() }
    },
    { upsert: true, new: true }
  );

  return { session, attendance: doc };
}

export async function markLeave({ sessionId, userId }) {
  const k = makeKey(sessionId, userId);
  const now = Date.now();

  const p = presence.get(k);
  const doc = await Attendance.findOne({ sessionId, userId });
  if (!doc) return null;

  if (p) {
    const delta = Math.max(0, now - p.joinedAtMs);
    doc.totalMs += delta;
    presence.delete(k);
  }

  doc.leftAt = new Date();
  doc.lastSeenAt = new Date();
  doc.status = doc.totalMs >= 5 * 60 * 1000 ? "present" : "absent";

  await doc.save();
  return doc;
}
