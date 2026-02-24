import express from "express";
import multer from "multer";
import { authRequired } from "../middleware/auth.js";
import { requireMember } from "../services/join.service.js";
import { saveLocalFile } from "../services/storage.service.js";
import FileObject from "../models/FileObject.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post("/upload/:classroomId", authRequired, upload.single("file"), async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const m = await requireMember(classroomId, req.user.id);
    if (!m) return res.status(403).json({ error: "Not a member" });
    if (!req.file) return res.status(400).json({ error: "File missing" });

    const stored = await saveLocalFile({ buffer: req.file.buffer, originalName: req.file.originalname });

    const doc = await FileObject.create({
      ownerId: req.user.id,
      classroomId,
      key: stored.key,
      url: stored.url,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size
    });

    res.json({ file: doc });
  } catch (e) { next(e); }
});

router.get("/:fileId", authRequired, async (req, res, next) => {
  try {
    const file = await FileObject.findById(req.params.fileId).lean();
    if (!file) return res.status(404).json({ error: "Not found" });

    const m = await requireMember(file.classroomId.toString(), req.user.id);
    if (!m) return res.status(403).json({ error: "Not allowed" });

    res.json({ url: file.url, file });
  } catch (e) { next(e); }
});

export default router;
