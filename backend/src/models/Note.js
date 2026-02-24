import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "FileObject" }]
  },
  { timestamps: true }
);

export default mongoose.model("Note", noteSchema);
