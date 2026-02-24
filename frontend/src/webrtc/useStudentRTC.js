import { useEffect, useRef } from "react";
import { RTC_CONFIG } from "./rtcConfig.js";

export function useStudentRTC(socket, sessionId, remoteVideoRef) {
  const pcRef = useRef(null);

  useEffect(() => {
    if (!socket || !sessionId) return;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("WebRTC connection state:", pc.connectionState);
    };

    const onOffer = async ({ fromSocketId, offer }) => {
      try {
        // If we already have a remote description (re-offer), reset the PC
        if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") {
          console.warn("Ignoring offer in state:", pc.signalingState);
          return;
        }

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("webrtc:ice", { toSocketId: fromSocketId, candidate: e.candidate, sessionId });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { toSocketId: fromSocketId, answer, sessionId });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    };

    const onIce = async ({ candidate }) => {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    socket.on("webrtc:offer", onOffer);
    socket.on("webrtc:ice", onIce);

    socket.emit("live:joinRoom", { sessionId }, (res) => {
      if (!res?.ok) {
        console.error("Failed to join room:", res?.error);
      }
    });
    socket.emit("attendance:join", { sessionId }, () => {});

    const onUnload = () => socket.emit("attendance:leave", { sessionId }, () => {});
    window.addEventListener("beforeunload", onUnload);

    return () => {
      window.removeEventListener("beforeunload", onUnload);
      socket.emit("attendance:leave", { sessionId }, () => {});
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:ice", onIce);
      pc.close();
    };
  }, [socket, sessionId, remoteVideoRef]);
}
