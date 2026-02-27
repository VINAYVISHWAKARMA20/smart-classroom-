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
          <p className="text-muted" style={{ marginBottom: 0 }}>Welcome back, {user?.name}! Here's your learning overview.</p>
        </div>
        {user && (
          <div className="pill">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 17L15 12L10 7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 12H3" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Join a Classroom
        </h3>
        <p className="text-muted mb-3">Enter a class code provided by your teacher to join a new classroom.</p>

        <div className="flex gap-2" style={{ maxWidth: "480px" }}>
          <input
            className="input"
            placeholder="Enter class code (e.g., ABC123)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && code && joinByCode()}
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
            <h3 style={{ marginBottom: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              My Classrooms
            </h3>
            <span className="text-muted text-sm">{data?.classrooms?.length || 0} total</span>
          </div>

          {data?.classrooms && data.classrooms.length > 0 ? (
            <div className="grid gap-3">
              {data.classrooms.map((c) => (
                <Link
                  key={c._id}
                  to={`/classroom/${c._id}`}
                  className="classroom-list-item"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
                    <div className="member-avatar" style={{ width: 38, height: 38, fontSize: "0.95rem", flexShrink: 0 }}>
                      {c.name?.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>{c.name}</div>
                      {c.description && (
                        <div className="text-muted text-sm" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path d="M9 18L15 12L9 6" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center" style={{ padding: "32px 0" }}>
              <div className="text-muted mb-2">No classrooms yet</div>
              <div className="text-sm text-muted">Join a classroom using a code from your teacher</div>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ marginBottom: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="var(--primary)" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Browse Classrooms
            </h3>
            <span className="text-muted text-sm">{data?.allClassrooms?.length || 0} total</span>
          </div>

          {data?.allClassrooms && data.allClassrooms.length > 0 ? (
            <div className="grid gap-3">
              {data.allClassrooms.map((c) => (
                <div key={c._id} className="classroom-list-item">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>{c.name}</div>
                    {c.description && (
                      <div className="text-muted text-sm">{c.description}</div>
                    )}
                    {c.teacherName && (
                      <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
                        Teacher: {c.teacherName}
                      </div>
                    )}
                  </div>
                  {c.isJoined ? (
                    <span className="attendance-badge attendance-badge--present" style={{ flexShrink: 0 }}>Joined</span>
                  ) : (
                    <button className="btn btn--primary btn--sm" onClick={() => joinByCode(c.joinCode)} disabled={!c.joinCode} style={{ flexShrink: 0 }}>
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center" style={{ padding: "32px 0" }}>
              <div className="text-muted mb-2">No classrooms found</div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section mt-4">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Pending Assignments
        </h3>

        {data?.pendingAssignments && data.pendingAssignments.length > 0 ? (
          <div className="grid gap-3">
            {data.pendingAssignments.map((a) => (
              <div key={a._id} className="classroom-list-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>{a.title}</div>
                  {a.classroomName && (
                    <div className="text-muted text-sm">{a.classroomName}</div>
                  )}
                </div>
                {a.dueAt ? (
                  <span className="text-sm text-muted" style={{ flexShrink: 0 }}>
                    Due: {new Date(a.dueAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-sm text-muted" style={{ flexShrink: 0 }}>No due date</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center" style={{ padding: "32px 0" }}>
            <div style={{ color: "#166534", fontWeight: 600, marginBottom: 4 }}>All caught up!</div>
            <div className="text-sm text-muted">No pending assignments</div>
          </div>
        )}
      </div>
    </div>
  );
}
