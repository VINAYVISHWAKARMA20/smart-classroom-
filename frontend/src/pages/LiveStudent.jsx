import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { useSocket } from "../sockets/useSocket.js";
import { useStudentRTC } from "../webrtc/useStudentRTC.js";

export default function LiveStudent() {
  const { sessionId } = useParams();
  const { token } = useAuth();
  const socket = useSocket(token);
  const remoteVideoRef = useRef(null);
  const navigate = useNavigate();

  const { connectionState } = useStudentRTC(socket, sessionId, remoteVideoRef);

  return (
    <div className="container main">
      <div className="classroom-header">
        <div>
          <h2><span className="live-indicator"></span> Live Class</h2>
          <p className="text-muted" style={{ marginBottom: 0 }}>Session: {sessionId?.slice(-6)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`connection-badge connection-badge--${connectionState}`}>
            {connectionState === "connected" && "Connected"}
            {connectionState === "connecting" && "Connecting..."}
            {connectionState === "waiting" && "Waiting for teacher..."}
            {connectionState === "disconnected" && "Disconnected"}
            {connectionState === "error" && "Connection Error"}
          </span>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>Leave</button>
        </div>
      </div>

      <div className="live-section">
        <div className="video-container" style={{ position: "relative" }}>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ minHeight: "400px" }} />
          {connectionState !== "connected" && (
            <div className="video-overlay">
              {connectionState === "waiting" && (
                <>
                  <div className="spinner" style={{ width: 48, height: 48, borderWidth: 5 }}></div>
                  <p style={{ marginTop: 16, fontWeight: 600, fontSize: "1.1rem" }}>Waiting for teacher to start broadcasting...</p>
                  <p className="text-muted" style={{ fontSize: "0.9rem" }}>The stream will appear automatically once the teacher connects.</p>
                </>
              )}
              {connectionState === "connecting" && (
                <>
                  <div className="spinner" style={{ width: 48, height: 48, borderWidth: 5 }}></div>
                  <p style={{ marginTop: 16, fontWeight: 600 }}>Establishing connection...</p>
                </>
              )}
              {connectionState === "disconnected" && (
                <>
                  <p style={{ fontWeight: 600, color: "var(--danger)" }}>Connection lost</p>
                  <button className="btn btn--primary btn--sm mt-2" onClick={() => window.location.reload()}>Reconnect</button>
                </>
              )}
              {connectionState === "error" && (
                <>
                  <p style={{ fontWeight: 600, color: "var(--danger)" }}>Failed to join session</p>
                  <p className="text-muted" style={{ fontSize: "0.9rem" }}>Please check the link and try again.</p>
                </>
              )}
            </div>
          )}
        </div>
        <div className="live-info-bar mt-3">
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>
            Your attendance is being tracked automatically.
          </span>
        </div>
      </div>
    </div>
  );
}
