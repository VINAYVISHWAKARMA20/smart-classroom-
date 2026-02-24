import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roleInClass: { type: String, enum: ["teacher", "student"], required: true },
    joinedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

membershipSchema.index({ classroomId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Membership", membershipSchema);
