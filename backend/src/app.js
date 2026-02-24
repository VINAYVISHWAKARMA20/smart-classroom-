import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env.js";
import errorMiddleware from "./middleware/error.js";

import authRoutes from "./routes/auth.routes.js";
import classroomRoutes from "./routes/classroom.routes.js";
import streamRoutes from "./routes/stream.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";
import noteRoutes from "./routes/note.routes.js";
import filesRoutes from "./routes/files.routes.js";
import liveRoutes from "./routes/live.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import submissionRoutes from "./routes/submission.routes.js";

const app = express();

// app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
const allowedOrigins = [
  env.CLIENT_ORIGIN,          // usually http://localhost:5173
  "http://localhost:5174"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests like Postman / server-to-server (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true
}));

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/live", liveRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/submissions", submissionRoutes);

app.use(errorMiddleware);

export default app;
