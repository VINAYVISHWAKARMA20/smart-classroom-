import express from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { requireMember } from "../services/join.service.js";
import Note from "../models/Note.js";

const router = express.Router();

router.get("/:classroomId", authRequired, async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const m = await requireMember(classroomId, req.user.id);
    if (!m) return res.status(403).json({ error: "Not a member" });

    const items = await Note.find({ classroomId }).populate("attachments").sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) { next(e); }
});

router.post("/:classroomId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const m = await requireMember(classroomId, req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const { title, body, attachments = [] } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const doc = await Note.create({ classroomId, createdBy: req.user.id, title, body: body || "", attachments });
    res.json({ note: doc });
  } catch (e) { next(e); }
});

router.put("/item/:noteId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const n = await Note.findById(req.params.noteId);
    if (!n) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(n.classroomId.toString(), req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const { title, body, attachments } = req.body;
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: "Title cannot be empty" });
      n.title = title;
    }
    if (body !== undefined) n.body = body;
    if (attachments !== undefined) n.attachments = attachments;

    await n.save();
    res.json({ note: n });
  } catch (e) { next(e); }
});

router.delete("/item/:noteId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const n = await Note.findById(req.params.noteId);
    if (!n) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(n.classroomId.toString(), req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    await n.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
