import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinCode: { type: String, required: true, unique: true, index: true },
    joinLinkToken: { type: String, required: true, unique: true, index: true },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Classroom", classroomSchema);
