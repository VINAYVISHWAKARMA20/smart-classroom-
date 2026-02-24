import express from "express";
import crypto from "crypto";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import Classroom from "../models/Classroom.js";
import Membership from "../models/Membership.js";
import { ensureMembership, requireMember } from "../services/join.service.js";

const router = express.Router();

router.post("/", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const joinCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const joinLinkToken = crypto.randomBytes(16).toString("hex");

    const classroom = await Classroom.create({
      name,
      description: description || "",
      createdBy: req.user.id,
      joinCode,
      joinLinkToken
    });

    await ensureMembership({ classroomId: classroom._id, userId: req.user.id, roleInClass: "teacher" });

    res.json({
      classroom,
      join: { code: joinCode, linkToken: joinLinkToken }
    });
  } catch (e) { next(e); }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const memberships = await Membership.find({ userId: req.user.id }).lean();
    const ids = memberships.map(m => m.classroomId);
    const classrooms = await Classroom.find({ _id: { $in: ids } }).lean();
    res.json({ classrooms, memberships });
  } catch (e) { next(e); }
});

router.post("/join/code", authRequired, requireRole("student"), async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });

    const classroom = await Classroom.findOne({ joinCode: code.toUpperCase() });
    if (!classroom) return res.status(404).json({ error: "Invalid code" });

    await ensureMembership({ classroomId: classroom._id, userId: req.user.id, roleInClass: "student" });
    res.json({ classroomId: classroom._id });
  } catch (e) { next(e); }
});

router.post("/join/link", authRequired, requireRole("student"), async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });

    const classroom = await Classroom.findOne({ joinLinkToken: token });
    if (!classroom) return res.status(404).json({ error: "Invalid link" });

    await ensureMembership({ classroomId: classroom._id, userId: req.user.id, roleInClass: "student" });
    res.json({ classroomId: classroom._id });
  } catch (e) { next(e); }
});

// GET single classroom details (MUST be after /me, /join/code, /join/link)
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const m = await requireMember(req.params.id, req.user.id);
    if (!m) return res.status(403).json({ error: "Not a member" });

    const classroom = await Classroom.findById(req.params.id).lean();
    if (!classroom) return res.status(404).json({ error: "Not found" });

    const memberCount = await Membership.countDocuments({ classroomId: req.params.id });

    res.json({
      classroom: { ...classroom, memberCount },
      membership: m
    });
  } catch (e) { next(e); }
});

// List members of a classroom
router.get("/:id/members", authRequired, async (req, res, next) => {
  try {
    const m = await requireMember(req.params.id, req.user.id);
    if (!m) return res.status(403).json({ error: "Not a member" });

    const members = await Membership.find({ classroomId: req.params.id })
      .populate("userId", "name email role")
      .sort({ joinedAt: 1 })
      .lean();

    res.json({ members });
  } catch (e) { next(e); }
});

// Remove a student from classroom (teacher only)
router.delete("/:id/members/:userId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const m = await requireMember(req.params.id, req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: "Cannot remove yourself" });
    }

    const target = await Membership.findOne({
      classroomId: req.params.id,
      userId: req.params.userId
    });
    if (!target) return res.status(404).json({ error: "Member not found" });
    if (target.roleInClass === "teacher") return res.status(400).json({ error: "Cannot remove a teacher" });

    await target.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
