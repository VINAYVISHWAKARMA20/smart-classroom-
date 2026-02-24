import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "ended"], default: "active" },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date }
  },
  { timestamps: true }
);

liveSessionSchema.index({ classroomId: 1, status: 1 });

export default mongoose.model("LiveSession", liveSessionSchema);
