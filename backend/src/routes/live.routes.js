import express from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { requireMember } from "../services/join.service.js";
import LiveSession from "../models/LiveSession.js";
import Attendance from "../models/Attendance.js";
import { getIO } from "../sockets/index.js";
import { emitNotification } from "../sockets/notifications.js";

const router = express.Router();

router.post("/:classroomId/start", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const m = await requireMember(classroomId, req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    await LiveSession.updateMany({ classroomId, status: "active" }, { $set: { status: "ended", endedAt: new Date() } });

    const session = await LiveSession.create({ classroomId, teacherId: req.user.id, status: "active" });

    const io = getIO();
    if (io) {
      emitNotification(io, classroomId, {
        type: "live_started",
        message: "A live class has started!",
        data: { sessionId: session._id, classroomId }
      });
    }

    res.json({ session });
  } catch (e) { next(e); }
});

// List all sessions for a classroom (teacher only)
router.get("/:classroomId/sessions", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const m = await requireMember(classroomId, req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const sessions = await LiveSession.find({ classroomId })
      .sort({ startedAt: -1 })
      .lean();

    res.json({ sessions });
  } catch (e) { next(e); }
});

router.post("/session/:sessionId/end", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(session.classroomId.toString(), req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    session.status = "ended";
    session.endedAt = new Date();
    await session.save();

    const rows = await Attendance.find({ sessionId: session._id });
    for (const r of rows) {
      if (r.status === "pending") {
        r.status = r.totalMs >= 5 * 60 * 1000 ? "present" : "absent";
        await r.save();
      }
    }

    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get("/session/:sessionId", authRequired, async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId).lean();
    if (!session) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(session.classroomId.toString(), req.user.id);
    if (!m) return res.status(403).json({ error: "Not a member" });

    res.json({ session });
  } catch (e) { next(e); }
});

router.get("/session/:sessionId/attendance", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId).lean();
    if (!session) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(session.classroomId.toString(), req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const rows = await Attendance.find({ sessionId: session._id }).populate("userId", "name email role").lean();
    res.json({ rows });
  } catch (e) { next(e); }
});

export default router;
