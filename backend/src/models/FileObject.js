import mongoose from "mongoose";

const fileObjectSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },

    key: { type: String, required: true },
    url: { type: String, required: true },

    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("FileObject", fileObjectSchema);
