// StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api.js";
import { useAuth } from "../auth/useAuth.js";
import { Link, useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const d = await apiRequest("/api/dashboard/student", { token });
      setData(d);
      console.log("allClassrooms", d?.allClassrooms);

    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function joinByCode(codeOverride) {
    setErr("");
    const codeToJoin = (codeOverride ?? code).trim();
    if (!codeToJoin) return;

    try {
      const r = await apiRequest("/api/classrooms/join/code", {
        method: "POST",
        token,
        body: { code: codeToJoin },
      });
      setCode("");
      nav(`/classroom/${r.classroomId}`);
    } catch (e) {
      setErr(e.message);
    }
  }

  if (loading) {
    return (
      <div className="container main">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container main">
      <div className="classroom-header">
        <div>
          <h2>Student Dashboard</h2>
          <p className="text-muted mt-1">Welcome back, {user?.name}! Here's your learning overview.</p>
        </div>
        {user && (
          <div className="pill">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 17L14 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <b>{user.name}</b> · Student
          </div>
        )}
      </div>

      {err && (
        <div className="alert">
          <b>Error:</b> {err}
        </div>
      )}

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-value">{data?.classrooms?.length || 0}</div>
          <div className="stat-label">Active Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.pendingAssignments?.length || 0}</div>
          <div className="stat-label">Pending Assignments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.attendancePct ?? 0}%</div>
          <div className="stat-label">Attendance</div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Join a Classroom</h3>
        <p className="text-muted mb-3">Enter a class code provided by your teacher to join a new classroom.</p>

        <div className="flex gap-2" style={{ maxWidth: "480px" }}>
          <input
            className="input"
            placeholder="Enter class code (e.g., ABC123)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn--primary" onClick={() => joinByCode()} disabled={!code}>
            Join Class
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="dashboard-section">
          <div className="flex justify-between items-center mb-4">
            <h3>My Classrooms</h3>
            <span className="text-muted">{data?.classrooms?.length || 0} total</span>
          </div>

          {data?.classrooms && data.classrooms.length > 0 ? (
            <div className="grid gap-3">
              {data.classrooms.map((c) => (
                <Link
                  key={c._id}
                  to={`/classroom/${c._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "var(--primary-light)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "600",
                      }}
                    >
                      {c.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: "var(--gray-900)" }}>{c.name}</div>
                      <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                        {c.description}
                      </div>
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted mb-2">No classrooms yet</div>
              <div className="text-sm text-muted">Join a classroom using a code from your teacher</div>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="flex justify-between items-center mb-4">
            <h3>All Classrooms</h3>
            <span className="text-muted">{data?.allClassrooms?.length || 0} total</span>
          </div>

          {data?.allClassrooms && data.allClassrooms.length > 0 ? (
            <div className="grid gap-3">
              {data.allClassrooms.map((c) => (
                <div key={c._id} className="p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between gap-3">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "600", color: "var(--gray-900)" }}>{c.name}</div>
                      <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                        {c.description}
                      </div>
                      {c.teacherName ? (
                        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                          Teacher: {c.teacherName}
                        </div>
                      ) : null}
                    </div>

                    {c.isJoined ? (
                      <span className="text-success font-semibold">Joined</span>
                    ) : (
                      <button className="btn btn--primary" onClick={() => joinByCode(c.joinCode)} disabled={!c.joinCode}>
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted mb-2">No classrooms found</div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section mt-4">
        <h3>Pending Assignments</h3>

        {data?.pendingAssignments && data.pendingAssignments.length > 0 ? (
          <div className="grid gap-3">
            {data.pendingAssignments.map((a) => (
              <div key={a._id} className="p-3 rounded-lg border border-gray-200">
                <div style={{ fontWeight: "600", color: "var(--gray-900)" }}>{a.title}</div>
                {a.dueAt ? (
                  <div className="text-xs text-muted mt-2">Due: {new Date(a.dueAt).toLocaleDateString()}</div>
                ) : (
                  <div className="text-xs text-muted mt-2">No due date</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-success font-semibold mb-1">All caught up!</div>
            <div className="text-sm text-muted">No pending assignments</div>
          </div>
        )}
      </div>
    </div>
  );
}
