import React, { useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { useSocket } from "../sockets/useSocket.js";
import { useStudentRTC } from "../webrtc/useStudentRTC.js";

export default function LiveStudent() {
  const { sessionId } = useParams();
  const { token } = useAuth();
  const socket = useSocket(token);
  const remoteVideoRef = useRef(null);

  useStudentRTC(socket, sessionId, remoteVideoRef);

  return (
    <div className="container main">
      <div className="classroom-header">
        <h2><span className="live-indicator"></span> Live Class (Student)</h2>
      </div>
      <div className="live-section">
        <div className="video-container">
          <video ref={remoteVideoRef} autoPlay playsInline />
        </div>
        <p className="text-muted mt-3">Your attendance is being tracked automatically.</p>
      </div>
    </div>
  );
}
