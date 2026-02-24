import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueAt: { type: Date },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "FileObject" }]
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
