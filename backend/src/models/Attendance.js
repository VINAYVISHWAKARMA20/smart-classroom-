import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveSession", required: true, index: true },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    firstJoinAt: { type: Date },
    lastSeenAt: { type: Date },
    leftAt: { type: Date },

    totalMs: { type: Number, default: 0 },
    status: { type: String, enum: ["present", "absent", "pending"], default: "pending" }
  },
  { timestamps: true }
);

attendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
