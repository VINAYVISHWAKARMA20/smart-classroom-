import { useEffect, useRef, useState } from "react";
import { RTC_CONFIG } from "./rtcConfig.js";

export function useStudentRTC(socket, sessionId, remoteVideoRef) {
  const pcRef = useRef(null);
  const teacherSocketIdRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const [connectionState, setConnectionState] = useState("waiting");

  useEffect(() => {
    if (!socket || !sessionId) return;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setConnectionState("connected");
      }
    };

    // Set onicecandidate at creation time (not inside onOffer)
    pc.onicecandidate = (e) => {
      if (e.candidate && teacherSocketIdRef.current) {
        socket.emit("webrtc:ice", {
          toSocketId: teacherSocketIdRef.current,
          candidate: e.candidate,
          sessionId
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("WebRTC connection state:", state);
      if (state === "connected") setConnectionState("connected");
      else if (state === "connecting") setConnectionState("connecting");
      else if (state === "disconnected" || state === "failed") setConnectionState("disconnected");
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    // Process queued ICE candidates after remote description is set
    async function processIceQueue() {
      const queue = iceCandidateQueueRef.current.splice(0);
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error("Error adding queued ICE candidate:", err);
        }
      }
    }

    const onOffer = async ({ fromSocketId, offer }) => {
      try {
        teacherSocketIdRef.current = fromSocketId;

        // Handle re-negotiation: if we're not in a state to accept an offer, skip
        if (pc.signalingState !== "stable") {
          console.warn("Ignoring offer in state:", pc.signalingState);
          return;
        }

        setConnectionState("connecting");
        await pc.setRemoteDescription(offer);
        await processIceQueue();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { toSocketId: fromSocketId, answer, sessionId });
      } catch (err) {
        console.error("Error handling offer:", err);
        setConnectionState("disconnected");
      }
    };

    const onIce = async ({ candidate }) => {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(candidate);
        } else {
          // Queue ICE candidates that arrive before the offer
          iceCandidateQueueRef.current.push(candidate);
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
        setConnectionState("error");
      } else {
        setConnectionState("waiting");
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

  return { connectionState };
}
