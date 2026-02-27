import Attendance from "../models/Attendance.js";
import LiveSession from "../models/LiveSession.js";

const presence = new Map(); // `${sessionId}:${userId}` -> { joinedAtMs }
const makeKey = (sessionId, userId) => `${sessionId}:${userId}`;

export async function markJoin({ sessionId, userId }) {
  const session = await LiveSession.findById(sessionId).lean();
  if (!session || session.status !== "active") throw new Error("Session not active");

  const k = makeKey(sessionId, userId);
  const now = Date.now();

  // If already tracked in-memory (duplicate join), first finalize the old one
  if (presence.has(k)) {
    const old = presence.get(k);
    const delta = Math.max(0, now - old.joinedAtMs);
    await Attendance.findOneAndUpdate(
      { sessionId, userId },
      { $inc: { totalMs: delta } }
    );
  }
  presence.set(k, { joinedAtMs: now });

  const doc = await Attendance.findOneAndUpdate(
    { sessionId, userId },
    {
      $setOnInsert: {
        classroomId: session.classroomId,
        firstJoinAt: new Date(now),
        totalMs: 0,
        status: "pending"
      },
      $set: {
        lastSeenAt: new Date(now),
        currentJoinedAt: new Date(now), // persisted so we survive server restarts
        leftAt: null
      }
    },
    { upsert: true, new: true }
  );

  return { session, attendance: doc };
}

export async function markLeave({ sessionId, userId }) {
  const k = makeKey(sessionId, userId);
  const now = Date.now();

  const doc = await Attendance.findOne({ sessionId, userId });
  if (!doc) return null;

  // Already left — avoid double-counting
  if (!doc.currentJoinedAt && !presence.has(k)) return doc;

  const p = presence.get(k);
  let delta = 0;

  if (p) {
    delta = Math.max(0, now - p.joinedAtMs);
    presence.delete(k);
  } else if (doc.currentJoinedAt) {
    // Fallback: presence map was lost (e.g. server restart)
    delta = Math.max(0, now - doc.currentJoinedAt.getTime());
  }

  doc.totalMs += delta;
  doc.leftAt = new Date(now);
  doc.lastSeenAt = new Date(now);
  doc.currentJoinedAt = null; // clear so double-leave doesn't add extra time
  doc.status = doc.totalMs >= 5 * 60 * 1000 ? "present" : "absent";

  await doc.save();
  return doc;
}
