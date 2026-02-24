import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env.js";

export async function saveLocalFile({ buffer, originalName }) {
  const ext = path.extname(originalName || "");
  const key = `${crypto.randomBytes(16).toString("hex")}${ext}`;
  const dir = path.resolve(env.UPLOAD_DIR);

  fs.mkdirSync(dir, { recursive: true });

  const fullPath = path.resolve(dir, key);
  await fs.promises.writeFile(fullPath, buffer);

  return { key, url: `/uploads/${key}` };
}
