import express from "express";
import { authRequired } from "../middleware/auth.js";
import Membership from "../models/Membership.js";
import Classroom from "../models/Classroom.js";
import Assignment from "../models/Assignment.js";
import LiveSession from "../models/LiveSession.js";
import Attendance from "../models/Attendance.js";

const router = express.Router();

router.get("/teacher", authRequired, async (req, res, next) => {
  try {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Teacher only" });

    const memberships = await Membership.find({
      userId: req.user.id,
      roleInClass: "teacher",
    }).lean();

    const classroomIds = memberships.map((m) => m.classroomId);

    const classrooms = await Classroom.find({ _id: { $in: classroomIds } }).lean();
    const assignmentsCount = await Assignment.countDocuments({ classroomId: { $in: classroomIds } });
    const sessions = await LiveSession.find({ classroomId: { $in: classroomIds } })
      .sort({ createdAt: -1 })
      .lean();

    // Per-classroom student count and assignment count
    const [studentCounts, assignmentCounts] = await Promise.all([
      Membership.aggregate([
        { $match: { classroomId: { $in: classroomIds }, roleInClass: "student" } },
        { $group: { _id: "$classroomId", count: { $sum: 1 } } }
      ]),
      Assignment.aggregate([
        { $match: { classroomId: { $in: classroomIds } } },
        { $group: { _id: "$classroomId", count: { $sum: 1 } } }
      ])
    ]);

    const studentCountMap = Object.fromEntries(studentCounts.map(s => [s._id.toString(), s.count]));
    const assignmentCountMap = Object.fromEntries(assignmentCounts.map(a => [a._id.toString(), a.count]));

    const enrichedClassrooms = classrooms.map(c => ({
      ...c,
      studentCount: studentCountMap[c._id.toString()] || 0,
      assignmentCount: assignmentCountMap[c._id.toString()] || 0
    }));

    const studentsCount = await Membership.countDocuments({
      classroomId: { $in: classroomIds },
      roleInClass: "student"
    });

    res.json({
      classrooms: enrichedClassrooms,
      assignmentsCount,
      studentsCount,
      liveSessionsCount: sessions.length,
      sessions
    });
  } catch (e) {
    next(e);
  }
});

router.get("/student", authRequired, async (req, res, next) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ error: "Student only" });

    // Student joined classes
    const memberships = await Membership.find({
      userId: req.user.id,
      roleInClass: "student",
    }).lean();

    const classroomIds = memberships.map((m) => m.classroomId);
    const joinedSet = new Set(classroomIds.map((id) => String(id)));

    // My classrooms
    const classrooms = await Classroom.find({ _id: { $in: classroomIds } }).lean();

    // All classrooms created by teachers (not archived)
    const all = await Classroom.find({ isArchived: false })
      .select("_id name description createdBy joinCode createdAt")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    const allClassrooms = all.map((c) => ({
      _id: c._id,
      name: c.name,
      description: c.description,
      teacherName: c.createdBy?.name || "",
      joinCode: c.joinCode,
      isJoined: joinedSet.has(String(c._id)),
    }));

    // Pending assignments for joined classes only
    const pendingAssignments = await Assignment.find({
      classroomId: { $in: classroomIds },
      $or: [{ dueAt: null }, { dueAt: { $gte: new Date() } }],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Attendance percentage for joined classes only
    const sessions = await LiveSession.find({
      classroomId: { $in: classroomIds },
      status: "ended",
    }).lean();

    const sessionIds = sessions.map((s) => s._id);

    const myAttendance = await Attendance.find({
      sessionId: { $in: sessionIds },
      userId: req.user.id,
    }).lean();

    const total = sessionIds.length || 0;
    const present = myAttendance.filter((a) => a.status === "present").length;
    const attendancePct = total === 0 ? 0 : Math.round((present / total) * 100);

    res.json({ classrooms, allClassrooms, pendingAssignments, attendancePct });
  } catch (e) {
    next(e);
  }
});

export default router;
