import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api.js";
import { useAuth } from "../auth/useAuth.js";

export default function JoinByLink() {
  const { token } = useAuth();
  const { token: linkToken } = useParams();
  const [err, setErr] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    async function run() {
      const r = await apiRequest("/api/classrooms/join/link", { method: "POST", token, body: { token: linkToken } });
      nav(`/classroom/${r.classroomId}`);
    }
    run().catch(e => setErr(e.message));
  }, [linkToken]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Joining...</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
    </div>
  );
}
