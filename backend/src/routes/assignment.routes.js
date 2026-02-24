import express from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { requireMember } from "../services/join.service.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import { getIO } from "../sockets/index.js";
import { emitNotification } from "../sockets/notifications.js";

const router = express.Router();

router.get("/:classroomId", authRequired, async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const m = await requireMember(classroomId, req.user.id);
    if (!m) return res.status(403).json({ error: "Not a member" });

    const items = await Assignment.find({ classroomId }).populate("attachments").sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) { next(e); }
});

router.post("/:classroomId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const m = await requireMember(classroomId, req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const { title, description, dueAt, attachments = [] } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const doc = await Assignment.create({
      classroomId,
      createdBy: req.user.id,
      title,
      description: description || "",
      dueAt: dueAt || null,
      attachments
    });

    const io = getIO();
    if (io) {
      emitNotification(io, classroomId, {
        type: "new_assignment",
        message: `New assignment: ${title}`,
        data: { assignmentId: doc._id, classroomId }
      });
    }

    res.json({ assignment: doc });
  } catch (e) { next(e); }
});

router.put("/item/:assignmentId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const a = await Assignment.findById(req.params.assignmentId);
    if (!a) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(a.classroomId.toString(), req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const { title, description, dueAt, attachments } = req.body;
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: "Title cannot be empty" });
      a.title = title;
    }
    if (description !== undefined) a.description = description;
    if (dueAt !== undefined) a.dueAt = dueAt;
    if (attachments !== undefined) a.attachments = attachments;

    await a.save();
    res.json({ assignment: a });
  } catch (e) { next(e); }
});

router.delete("/item/:assignmentId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const a = await Assignment.findById(req.params.assignmentId);
    if (!a) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(a.classroomId.toString(), req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    await Submission.deleteMany({ assignmentId: a._id });
    await a.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
