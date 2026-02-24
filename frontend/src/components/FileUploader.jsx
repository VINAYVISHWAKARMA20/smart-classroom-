import React, { useState } from "react";
import { apiRequest } from "../api/api.js";
import { useAuth } from "../auth/useAuth.js";

export default function FileUploader({ classroomId, onUploaded }) {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const data = await apiRequest(`/api/files/upload/${classroomId}`, { method: "POST", body: fd, token, isForm: true });
      onUploaded?.(data.file);
      setFile(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={upload} disabled={!file || busy}>{busy ? "Uploading..." : "Upload"}</button>
    </div>
  );
}
