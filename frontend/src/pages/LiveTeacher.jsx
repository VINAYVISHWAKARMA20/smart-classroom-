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
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const { isScreenSharing, toggleScreenShare } = useTeacherRTC(socket, sessionId, localVideoRef);

  async function endClass() {
    if (!confirm("End this live class? All students will be disconnected.")) return;
    try {
      await apiRequest(`/api/live/session/${sessionId}/end`, { method: "POST", token });
      navigate(-1);
    } catch (e) { setErr(e.message); }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/live/student/${sessionId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="container main">
      <div className="classroom-header">
        <div>
          <h2><span className="live-indicator"></span> Live Class</h2>
          <p className="text-muted" style={{ marginBottom: 0 }}>You are broadcasting to students</p>
        </div>
        <span className="connection-badge connection-badge--connected">Broadcasting</span>
      </div>

      {err && <div className="alert"><b>Error:</b> {err}</div>}

      <div className="live-section" style={{ textAlign: "left" }}>
        <p className="mb-2" style={{ fontWeight: 600 }}>Share this link with students:</p>
        <div className="code-box flex justify-between items-center">
          <code style={{ wordBreak: "break-all" }}>{window.location.origin}/live/student/{sessionId}</code>
          <button className="btn btn--ghost btn--sm" onClick={copyLink}
            style={{ color: "white", borderColor: "rgba(255,255,255,0.3)", minWidth: 70 }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="video-container">
          <video ref={localVideoRef} autoPlay playsInline muted style={{ minHeight: "360px" }} />
        </div>

        <div className="flex gap-2 mt-3" style={{ justifyContent: "center" }}>
          {navigator.mediaDevices?.getDisplayMedia && (
            <button className={`btn ${isScreenSharing ? "btn--ghost" : "btn--primary"}`}
              onClick={toggleScreenShare}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
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
