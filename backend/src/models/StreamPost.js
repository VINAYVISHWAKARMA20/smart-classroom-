import mongoose from "mongoose";

const streamPostSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "FileObject" }]
  },
  { timestamps: true }
);

export default mongoose.model("StreamPost", streamPostSchema);
