import express from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { requireMember } from "../services/join.service.js";
import Submission from "../models/Submission.js";
import Assignment from "../models/Assignment.js";

const router = express.Router();

// Student submits (or resubmits) to an assignment
router.post("/:assignmentId", authRequired, requireRole("student"), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const m = await requireMember(assignment.classroomId.toString(), req.user.id);
    if (!m) return res.status(403).json({ error: "Not a member" });

    const { text, attachments = [] } = req.body;
    if (!text && attachments.length === 0) {
      return res.status(400).json({ error: "Submission must include text or attachments" });
    }

    // Upsert: allows resubmission
    const submission = await Submission.findOneAndUpdate(
      { assignmentId: assignment._id, studentId: req.user.id },
      {
        $set: {
          classroomId: assignment.classroomId,
          text,
          attachments,
          submittedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.json({ submission });
  } catch (e) { next(e); }
});

// Teacher views all submissions for an assignment
router.get("/:assignmentId", authRequired, requireRole("teacher"), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const m = await requireMember(assignment.classroomId.toString(), req.user.id);
    if (!m || m.roleInClass !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const submissions = await Submission.find({ assignmentId: assignment._id })
      .populate("studentId", "name email")
      .populate("attachments")
      .sort({ submittedAt: -1 })
      .lean();

    res.json({ submissions });
  } catch (e) { next(e); }
});

// Student views their own submission for an assignment
router.get("/:assignmentId/mine", authRequired, requireRole("student"), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const m = await requireMember(assignment.classroomId.toString(), req.user.id);
    if (!m) return res.status(403).json({ error: "Not a member" });

    const submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: req.user.id
    }).populate("attachments").lean();

    res.json({ submission: submission || null });
  } catch (e) { next(e); }
});

export default router;
