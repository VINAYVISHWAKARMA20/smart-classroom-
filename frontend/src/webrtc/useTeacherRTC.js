import { useEffect, useRef, useCallback, useState } from "react";
import { RTC_CONFIG } from "./rtcConfig.js";

export function useTeacherRTC(socket, sessionId, localVideoRef) {
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // studentSocketId -> RTCPeerConnection
  const pendingPeersRef = useRef([]); // peers that joined before camera was ready
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Replace video track on all peer connections
  const replaceTrackOnAllPeers = useCallback((oldTrack, newTrack) => {
    peersRef.current.forEach((pc) => {
      const sender = pc.getSenders().find(s => s.track?.kind === oldTrack.kind);
      if (sender) sender.replaceTrack(newTrack);
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Switch back to camera
      const cameraStream = localStreamRef.current;
      if (!cameraStream) return;
      const cameraVideoTrack = cameraStream.getVideoTracks()[0];
      const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
      if (cameraVideoTrack && screenTrack) {
        replaceTrackOnAllPeers(screenTrack, cameraVideoTrack);
      }
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = cameraStream;
      setIsScreenSharing(false);
    } else {
      // Switch to screen share
      if (!navigator.mediaDevices?.getDisplayMedia) {
        console.warn("Screen sharing not supported in this browser");
        return;
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];

        if (cameraTrack && screenTrack) {
          replaceTrackOnAllPeers(cameraTrack, screenTrack);
        }

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);

        // Handle browser "stop sharing" button
        screenTrack.onended = () => {
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack && screenTrack) {
            replaceTrackOnAllPeers(screenTrack, camTrack);
          }
          screenStreamRef.current = null;
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
          setIsScreenSharing(false);
        };
      } catch (e) {
        console.warn("Screen share cancelled:", e.message);
      }
    }
  }, [isScreenSharing, replaceTrackOnAllPeers, localVideoRef]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    let cancelled = false;

    // Create a peer connection and send offer to a student
    function connectToPeer(socketId) {
      const activeStream = screenStreamRef.current || localStreamRef.current;
      if (!activeStream) {
        // Camera not ready yet — queue for later
        pendingPeersRef.current.push(socketId);
        return;
      }

      // Don't create duplicate connections
      if (peersRef.current.has(socketId)) return;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peersRef.current.set(socketId, pc);

      // Add audio from camera stream, video from active stream (camera or screen)
      const audioTrack = localStreamRef.current?.getAudioTracks()[0];
      const videoTrack = activeStream.getVideoTracks()[0];
      if (audioTrack) pc.addTrack(audioTrack, activeStream);
      if (videoTrack) pc.addTrack(videoTrack, activeStream);

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("webrtc:ice", { toSocketId: socketId, candidate: e.candidate, sessionId });
      };

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer).then(() => offer))
        .then(offer => {
          socket.emit("webrtc:offer", { toSocketId: socketId, offer, sessionId });
        })
        .catch(err => console.error("Error creating offer:", err));
    }

    // Step 1: Get camera FIRST, then join the room
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Step 2: Now that camera is ready, join the room
        socket.emit("live:joinRoom", { sessionId }, () => {});
        socket.emit("attendance:join", { sessionId }, () => {});

        // Step 3: Process any peers that arrived while camera was initializing
        const pending = pendingPeersRef.current.splice(0);
        for (const socketId of pending) {
          connectToPeer(socketId);
        }
      } catch (err) {
        console.error("Failed to get camera:", err);
      }
    }

    const onPeerJoined = ({ socketId }) => {
      connectToPeer(socketId);
    };

    const onAnswer = async ({ fromSocketId, answer }) => {
      const pc = peersRef.current.get(fromSocketId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(answer);
      } catch (err) {
        console.error("Error setting remote description:", err);
      }
    };

    const onIce = async ({ fromSocketId, candidate }) => {
      const pc = peersRef.current.get(fromSocketId);
      if (!pc) return;
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    // Register socket listeners BEFORE init so we don't miss any events
    socket.on("live:peerJoined", onPeerJoined);
    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice", onIce);

    // Start initialization
    init();

    const onUnload = () => socket.emit("attendance:leave", { sessionId }, () => {});
    window.addEventListener("beforeunload", onUnload);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", onUnload);
      socket.emit("attendance:leave", { sessionId }, () => {});
      socket.off("live:peerJoined", onPeerJoined);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice", onIce);

      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      pendingPeersRef.current = [];
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [socket, sessionId, localVideoRef]);

  return { isScreenSharing, toggleScreenShare };
}
