import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { useSocket } from "../sockets/useSocket.js";
import { useTeacherRTC } from "../webrtc/useTeacherRTC.js";
import { apiRequest } from "../api/api.js";

export default function LiveTeacher() {
  const { sessionId } = useParams();
  const { token } = useAuth();
  const socket = useSocket(token);
  const localVideoRef = useRef(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const { isScreenSharing, toggleScreenShare } = useTeacherRTC(socket, sessionId, localVideoRef);

  async function endClass() {
    try {
      await apiRequest(`/api/live/session/${sessionId}/end`, { method: "POST", token });
      navigate(-1);
    } catch (e) { setErr(e.message); }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/live/student/${sessionId}`);
  }

  return (
    <div className="container main">
      <div className="classroom-header">
        <h2><span className="live-indicator"></span> Live Class (Teacher)</h2>
      </div>

      {err && <div className="alert"><b>Error:</b> {err}</div>}

      <div className="live-section" style={{ textAlign: "left" }}>
        <p className="mb-2" style={{ fontWeight: 600 }}>Share this link with students:</p>
        <div className="code-box flex justify-between items-center">
          <code>{window.location.origin}/live/student/{sessionId}</code>
          <button className="btn btn--ghost btn--sm" onClick={copyLink}
            style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}>Copy</button>
        </div>

        <div className="video-container">
          <video ref={localVideoRef} autoPlay playsInline muted />
        </div>

        <div className="flex gap-2 mt-3" style={{ justifyContent: "center" }}>
          {navigator.mediaDevices?.getDisplayMedia && (
            <button className={`btn ${isScreenSharing ? "btn--ghost" : "btn--primary"}`}
              onClick={toggleScreenShare}>
              {isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            </button>
          )}
          <button className="btn btn--ghost" onClick={endClass}
            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            End Live Class
          </button>
        </div>
      </div>
    </div>
  );
}
