import express from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { requireMember } from "../services/join.service.js";
import StreamPost from "../models/StreamPost.js";

const router = express.Router();

router.get("/:classroomId", authRequired, async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const m = await requireMember(classroomId, req.user.id);
    if (!m) return res.status(403).json({ error: "Not a member" });

    const items = await StreamPost.find({ classroomId })
      .populate("authorId", "name role")
      .populate("attachments")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items });
  } catch (e) { next(e); }
});

router.post("/:classroomId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const m = await requireMember(classroomId, req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const { content, attachments = [] } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const post = await StreamPost.create({ classroomId, authorId: req.user.id, content, attachments });
    res.json({ post });
  } catch (e) { next(e); }
});

router.put("/item/:postId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const post = await StreamPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(post.classroomId.toString(), req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const { content, attachments } = req.body;
    if (content !== undefined) {
      if (!content.trim()) return res.status(400).json({ error: "Content cannot be empty" });
      post.content = content;
    }
    if (attachments !== undefined) post.attachments = attachments;

    await post.save();
    res.json({ post });
  } catch (e) { next(e); }
});

router.delete("/item/:postId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const post = await StreamPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(post.classroomId.toString(), req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    await post.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
