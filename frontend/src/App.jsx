import React, { useEffect } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
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
import "./styles.css";

export default function App() {
  const { user, token } = useAuth();
  const socket = useSocket(token);
  const { toasts, addToast } = useToast();

  useEffect(() => {
    if (!socket) return;

    socket.emit("notifications:subscribe", {}, () => {});

    const onNotification = (payload) => {
      addToast(
        payload.message,
        payload.type === "live_started" ? "live" : "info"
      );
    };

    socket.on("notification", onNotification);

    return () => {
      socket.off("notification", onNotification);
    };
  }, [socket, addToast]);

  return (
    <div className="app-wrapper">
      <Nav />
      <ToastContainer toasts={toasts} />

      <Routes>
        <Route
          path="/"
          element={
            user ? (
              user.role === "teacher" ? (
                <Navigate to="/teacher" />
              ) : (
                <Navigate to="/student" />
              )
            ) : (
              <div className="landing-page">

                {/* ================= HERO SECTION ================= */}
                <section className="hero-section">
                  <div className="hero-content">
                    <h1 className="hero-title">
                      Elevate Your <br />
                      <span className="accent-text">
                        Learning Experience
                      </span>
                    </h1>

                    <p className="hero-subtitle">
                      The Classroom MVP platform brings teachers and students
                      together in a seamless, real-time digital environment.
                    </p>

                    <div className="hero-btns">
                      <Link to="/signup" className="btn-primary">
                        Get Started
                      </Link>

                      <Link to="/login" className="btn-outline">
                        Login
                      </Link>
                    </div>
                  </div>

                  {/* HERO VISUAL AREA */}
                  <div className="hero-visual">
                    <div className="gradient-blur"></div>

                    <div className="live-status-pill">
                      Live Sessions Active
                      <span className="red-dot"></span>
                    </div>
                  </div>
                </section>

                {/* ================= FEATURES SECTION ================= */}
                <section className="features-grid-section">
                  <div className="features-container">

                    <div className="f-card f-pink">
                      <div className="f-icon">🎥</div>
                      <h4>Live Video Classroom</h4>
                      <p>
                        HD video conferencing, whiteboard, screen sharing &
                        breakout rooms.
                      </p>
                    </div>

                    <div className="f-card f-yellow">
                      <div className="f-icon">📖</div>
                      <h4>Assignments & Grading</h4>
                      <p>
                        Create, distribute & evaluate assignments with detailed
                        feedback.
                      </p>
                    </div>

                    <div className="f-card f-green">
                      <div className="f-icon">✅</div>
                      <h4>Attendance Tracking</h4>
                      <p>
                        Automated attendance with real-time participation
                        insights.
                      </p>
                    </div>

                    <div className="f-card f-blue">
                      <div className="f-icon">💬</div>
                      <h4>Discussion Forums</h4>
                      <p>
                        Persistent chat rooms for collaboration & Q&A.
                      </p>
                    </div>

                    <div className="f-card f-purple">
                      <div className="f-icon">📂</div>
                      <h4>Resource Repository</h4>
                      <p>
                        Upload, organize & share notes, materials & videos.
                      </p>
                    </div>

                    <div className="f-card f-orange">
                      <div className="f-icon">📊</div>
                      <h4>Performance Dashboard</h4>
                      <p>
                        Track quizzes, assignments, attendance & academic
                        progress.
                      </p>
                    </div>

                  </div>
                </section>

                {/* ================= PREMIUM BOTTOM SPACE ================= */}
                <section className="bottom-blank-section">
                  <div className="bottom-gradient"></div>
                </section>

              </div>
            )
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/classroom/:id"
          element={
            <ProtectedRoute>
              <Classroom />
            </ProtectedRoute>
          }
        />

        <Route
          path="/join/:token"
          element={
            <ProtectedRoute role="student">
              <JoinByLink />
            </ProtectedRoute>
          }
        />

        <Route
          path="/live/teacher/:sessionId"
          element={
            <ProtectedRoute role="teacher">
              <LiveTeacher />
            </ProtectedRoute>
          }
        />

        <Route
          path="/live/student/:sessionId"
          element={
            <ProtectedRoute role="student">
              <LiveStudent />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}