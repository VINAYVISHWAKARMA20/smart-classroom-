import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import ToastContainer, { useToast } from "./components/Toast.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import Classroom from "./pages/Classroom.jsx";
import JoinByLink from "./pages/JoinByLink.jsx";
import LiveTeacher from "./pages/LiveTeacher.jsx";
import LiveStudent from "./pages/LiveStudent.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import { useAuth } from "./auth/useAuth.js";
import { useSocket } from "./sockets/useSocket.js";

export default function App() {
  const { user, token } = useAuth();
  const socket = useSocket(token);
  const { toasts, addToast } = useToast();

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!socket) return;

    socket.emit("notifications:subscribe", {}, () => {});

    const onNotification = (payload) => {
      addToast(payload.message, payload.type === "live_started" ? "live" : "info");
    };

    socket.on("notification", onNotification);

    return () => {
      socket.off("notification", onNotification);
    };
  }, [socket, addToast]);

  return (
    <>
      <Nav />
      <ToastContainer toasts={toasts} />
      <Routes>
        <Route path="/" element={
          user ? (
            user.role === "teacher" ? <Navigate to="/teacher" /> : <Navigate to="/student" />
          ) : (
            <div style={{ padding: 16 }}>
              <h2>Classroom MVP</h2>
              <p>Please login/signup.</p>
            </div>
          )
        } />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/teacher" element={
          <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
        } />

        <Route path="/student" element={
          <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
        } />

        <Route path="/classroom/:id" element={
          <ProtectedRoute><Classroom /></ProtectedRoute>
        } />

        <Route path="/join/:token" element={
          <ProtectedRoute role="student"><JoinByLink /></ProtectedRoute>
        } />

        <Route path="/live/teacher/:sessionId" element={
          <ProtectedRoute role="teacher"><LiveTeacher /></ProtectedRoute>
        } />

        <Route path="/live/student/:sessionId" element={
          <ProtectedRoute role="student"><LiveStudent /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
