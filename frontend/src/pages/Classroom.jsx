import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../api/api.js";
import { useAuth } from "../auth/useAuth.js";
import Tabs from "../components/Tabs.jsx";
import FileUploader from "../components/FileUploader.jsx";
import Attachments from "../components/Attachments.jsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Classroom() {
  const { id: classroomId } = useParams();
  const { token, user } = useAuth();
  const [tab, setTab] = useState("stream");
  const [stream, setStream] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");

  // Classroom info
  const [classroomInfo, setClassroomInfo] = useState(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  // Submission state (student)
  const [submittingId, setSubmittingId] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionAttachments, setSubmissionAttachments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState({});

  // Submission view state (teacher)
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);

  async function loadAll() {
    const [s, a, n, c] = await Promise.all([
      apiRequest(`/api/stream/${classroomId}`, { token }),
      apiRequest(`/api/assignments/${classroomId}`, { token }),
      apiRequest(`/api/notes/${classroomId}`, { token }),
      apiRequest(`/api/classrooms/${classroomId}`, { token }).catch(() => null),
    ]);
    setStream(s.items);
    setAssignments(a.items);
    setNotes(n.items);
    if (c) setClassroomInfo(c);
  }

  async function loadMySubmissions(assignmentList) {
    if (user?.role !== "student") return;
    const items = assignmentList || assignments;
    const subs = {};
    for (const a of items) {
      try {
        const r = await apiRequest(`/api/submissions/${a._id}/mine`, { token });
        if (r.submission) subs[a._id] = r.submission;
      } catch { /* not submitted yet */ }
    }
    setMySubmissions(subs);
  }

  useEffect(() => {
    loadAll()
      .then(() => {
        // loadMySubmissions will use the latest assignments from state after next render
      })
      .catch(e => setErr(e.message));
  }, [classroomId]);

  // Load submissions when assignments change (for students)
  useEffect(() => {
    if (assignments.length > 0 && user?.role === "student") {
      loadMySubmissions(assignments);
    }
  }, [assignments]);

  const canPost = user?.role === "teacher";

  // --- Create functions ---
  async function createStreamPost() {
    try {
      await apiRequest(`/api/stream/${classroomId}`, { method: "POST", token, body: { content: text, attachments: attachments.map(a => a._id) } });
      setText(""); setAttachments([]);
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  async function createAssignment() {
    try {
      await apiRequest(`/api/assignments/${classroomId}`, { method: "POST", token, body: { title, description: body, attachments: attachments.map(a => a._id) } });
      setTitle(""); setBody(""); setAttachments([]);
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  async function createNote() {
    try {
      await apiRequest(`/api/notes/${classroomId}`, { method: "POST", token, body: { title, body, attachments: attachments.map(a => a._id) } });
      setTitle(""); setBody(""); setAttachments([]);
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  // --- Edit functions ---
  function startEditing(item, type) {
    setEditingId(item._id);
    setEditTitle(item.title || "");
    setEditBody(type === "assignment" ? (item.description || "") : type === "note" ? (item.body || "") : (item.content || ""));
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  }

  async function updateStreamPost(postId) {
    try {
      await apiRequest(`/api/stream/item/${postId}`, { method: "PUT", token, body: { content: editBody } });
      cancelEditing();
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  async function updateAssignment(assignmentId) {
    try {
      await apiRequest(`/api/assignments/item/${assignmentId}`, { method: "PUT", token, body: { title: editTitle, description: editBody } });
      cancelEditing();
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  async function updateNote(noteId) {
    try {
      await apiRequest(`/api/notes/item/${noteId}`, { method: "PUT", token, body: { title: editTitle, body: editBody } });
      cancelEditing();
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  // --- Delete functions ---
  async function deleteStreamPost(postId) {
    if (!confirm("Delete this announcement?")) return;
    try {
      await apiRequest(`/api/stream/item/${postId}`, { method: "DELETE", token });
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  async function deleteAssignment(assignmentId) {
    if (!confirm("Delete this assignment? All student submissions will also be deleted.")) return;
    try {
      await apiRequest(`/api/assignments/item/${assignmentId}`, { method: "DELETE", token });
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  async function deleteNote(noteId) {
    if (!confirm("Delete this note?")) return;
    try {
      await apiRequest(`/api/notes/item/${noteId}`, { method: "DELETE", token });
      await loadAll();
    } catch (e) { setErr(e.message); }
  }

  // --- Submission functions ---
  async function submitAssignment(assignmentId) {
    try {
      await apiRequest(`/api/submissions/${assignmentId}`, {
        method: "POST", token,
        body: { text: submissionText, attachments: submissionAttachments.map(a => a._id) }
      });
      setSubmittingId(null);
      setSubmissionText("");
      setSubmissionAttachments([]);
      await loadMySubmissions(assignments);
    } catch (e) { setErr(e.message); }
  }

  async function viewSubmissions(assignmentId) {
    try {
      const r = await apiRequest(`/api/submissions/${assignmentId}`, { token });
      setSubmissionsList(r.submissions);
      setViewingSubmissions(viewingSubmissions === assignmentId ? null : assignmentId);
    } catch (e) { setErr(e.message); }
  }

  // --- Live class ---
  async function startLive() {
    try {
      const r = await apiRequest(`/api/live/${classroomId}/start`, { method: "POST", token });
      const sessionId = r.session._id;
      if (user.role === "teacher") window.location.href = `/live/teacher/${sessionId}`;
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="container main">
      <div className="classroom-header">
        <div>
          <h2>{classroomInfo?.classroom?.name || "Classroom"}</h2>
          {classroomInfo?.classroom?.description && (
            <p className="text-muted" style={{ marginBottom: 0 }}>{classroomInfo.classroom.description}</p>
          )}
          <div className="flex gap-2 mt-1" style={{ fontSize: "0.875rem" }}>
            {classroomInfo?.classroom?.memberCount != null && (
              <span className="text-muted">{classroomInfo.classroom.memberCount} members</span>
            )}
            {canPost && classroomInfo?.classroom?.joinCode && (
              <span className="text-muted">| Code: <code style={{ background: "var(--gray-100)", padding: "2px 6px", borderRadius: 4 }}>{classroomInfo.classroom.joinCode}</code></span>
            )}
          </div>
        </div>
        {user && (
          <div className="pill">
            <b>{user.name}</b> · {user.role}
          </div>
        )}
      </div>

      {err && <div className="alert"><b>Error:</b> {err}</div>}

      <div className="tabs-container">
        <div className="tabs-header">
          <button className={`tab ${tab === "stream" ? "active" : ""}`} onClick={() => setTab("stream")}>
            Stream
          </button>
          <button className={`tab ${tab === "assignments" ? "active" : ""}`} onClick={() => setTab("assignments")}>
            Assignments
          </button>
          <button className={`tab ${tab === "notes" ? "active" : ""}`} onClick={() => setTab("notes")}>
            Notes
          </button>
          <button className={`tab ${tab === "live" ? "active" : ""}`} onClick={() => setTab("live")}>
            Live Class
          </button>
          {canPost && (
            <button className={`tab ${tab === "attendance" ? "active" : ""}`} onClick={() => setTab("attendance")}>
              Attendance
            </button>
          )}
          <button className={`tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>
            Members
          </button>
        </div>

        <div className="tab-content">
          {/* ===== LIVE CLASS TAB ===== */}
          {tab === "live" && (
            <div className="live-section">
              <h3><span className="live-indicator"></span> Live Class Session</h3>
              {user?.role === "teacher" ? (
                <>
                  <button className="btn btn--primary mb-3" onClick={startLive}>Start Live Class</button>
                  <p className="text-muted">
                    After starting, share the link shown on the teacher live page.
                  </p>
                </>
              ) : (
                <p className="text-muted">Students need the session link from teacher to join.</p>
              )}
            </div>
          )}

          {/* ===== CREATE FORM (teacher only, not on live/attendance/members tabs) ===== */}
          {canPost && !["live", "attendance", "members"].includes(tab) && (
            <div className="create-post">
              <h3>Create New ({tab})</h3>
              <FileUploader classroomId={classroomId} onUploaded={(f) => setAttachments((prev) => [...prev, f])} />
              <Attachments attachments={attachments} />

              {tab === "stream" && (
                <>
                  <textarea
                    className="input mb-2"
                    placeholder="Write an announcement..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows="4"
                  />
                  <button className="btn btn--primary" onClick={createStreamPost} disabled={!text}>
                    Post Announcement
                  </button>
                </>
              )}

              {tab === "assignments" && (
                <>
                  <input
                    className="input mb-2"
                    placeholder="Assignment Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <textarea
                    className="input mb-2"
                    placeholder="Assignment Description..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows="4"
                  />
                  <button className="btn btn--primary" onClick={createAssignment} disabled={!title}>
                    Create Assignment
                  </button>
                </>
              )}

              {tab === "notes" && (
                <>
                  <input
                    className="input mb-2"
                    placeholder="Note Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <textarea
                    className="input mb-2"
                    placeholder="Note content..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows="4"
                  />
                  <button className="btn btn--primary" onClick={createNote} disabled={!title}>
                    Create Note
                  </button>
                </>
              )}
            </div>
          )}

          {/* ===== STREAM TAB ===== */}
          {tab === "stream" && (
            <div>
              <h3 className="mb-3">Recent Announcements</h3>
              <div className="posts-list">
                {stream.map(p => (
                  <div key={p._id} className="post">
                    {editingId === p._id ? (
                      <div className="edit-form">
                        <textarea className="input mb-2" value={editBody}
                          onChange={(e) => setEditBody(e.target.value)} rows="4" />
                        <div className="flex gap-2">
                          <button className="btn btn--primary btn--sm" onClick={() => updateStreamPost(p._id)}
                            disabled={!editBody.trim()}>Save</button>
                          <button className="btn btn--ghost btn--sm" onClick={cancelEditing}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="post-author">
                          {p.authorId?.name}
                          {canPost && (
                            <span className="flex gap-2" style={{ marginLeft: "auto" }}>
                              <button className="btn btn--ghost btn--sm" onClick={() => startEditing(p, "stream")}>Edit</button>
                              <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => deleteStreamPost(p._id)}>Delete</button>
                            </span>
                          )}
                        </div>
                        <p className="post-content">{p.content}</p>
                        <Attachments attachments={p.attachments || []} />
                      </>
                    )}
                  </div>
                ))}
                {stream.length === 0 && <p className="text-muted">No announcements yet.</p>}
              </div>
            </div>
          )}

          {/* ===== ASSIGNMENTS TAB ===== */}
          {tab === "assignments" && (
            <div>
              <h3 className="mb-3">Assignments</h3>
              <div className="assignments-list">
                {assignments.map(a => (
                  <div key={a._id} className="assignment">
                    {editingId === a._id ? (
                      <div className="edit-form">
                        <input className="input mb-2" value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                        <textarea className="input mb-2" value={editBody}
                          onChange={(e) => setEditBody(e.target.value)} placeholder="Description" rows="3" />
                        <div className="flex gap-2">
                          <button className="btn btn--primary btn--sm" onClick={() => updateAssignment(a._id)}
                            disabled={!editTitle.trim()}>Save</button>
                          <button className="btn btn--ghost btn--sm" onClick={cancelEditing}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="assignment-title">
                          {a.title}
                          {canPost && (
                            <span className="flex gap-2" style={{ marginLeft: "auto" }}>
                              <button className="btn btn--ghost btn--sm" onClick={() => startEditing(a, "assignment")}>Edit</button>
                              <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => deleteAssignment(a._id)}>Delete</button>
                            </span>
                          )}
                        </div>
                        <p className="assignment-description">{a.description}</p>
                        {a.dueAt && (
                          <div className="text-muted" style={{ fontSize: "0.85rem", marginBottom: 8 }}>
                            Due: {new Date(a.dueAt).toLocaleDateString()}
                          </div>
                        )}
                        <Attachments attachments={a.attachments || []} />

                        {/* Teacher: View Submissions */}
                        {canPost && (
                          <div className="mt-2">
                            <button className="btn btn--ghost btn--sm" onClick={() => viewSubmissions(a._id)}>
                              {viewingSubmissions === a._id ? "Hide Submissions" : "View Submissions"}
                            </button>
                            {viewingSubmissions === a._id && (
                              <div className="submissions-list mt-2">
                                <h4 style={{ fontSize: "1rem", marginBottom: 12 }}>Submissions ({submissionsList.length})</h4>
                                {submissionsList.map(s => (
                                  <div key={s._id} className="submission-item">
                                    <div className="submission-student">{s.studentId?.name} ({s.studentId?.email})</div>
                                    {s.text && <p className="submission-text">{s.text}</p>}
                                    <Attachments attachments={s.attachments || []} />
                                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                                      Submitted: {new Date(s.submittedAt).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                                {submissionsList.length === 0 && <p className="text-muted">No submissions yet.</p>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Student: Submit Assignment */}
                        {user?.role === "student" && (
                          <div className="submission-section">
                            {mySubmissions[a._id] ? (
                              <div className="submission-status submission-status--submitted">
                                <span>Submitted on {new Date(mySubmissions[a._id].submittedAt).toLocaleDateString()}</span>
                                <button className="btn btn--ghost btn--sm" onClick={() => {
                                  setSubmittingId(a._id);
                                  setSubmissionText(mySubmissions[a._id].text || "");
                                  setSubmissionAttachments([]);
                                }}>Resubmit</button>
                              </div>
                            ) : (
                              <button className="btn btn--primary btn--sm" onClick={() => setSubmittingId(a._id)}>
                                Submit Assignment
                              </button>
                            )}
                            {submittingId === a._id && (
                              <div className="submission-form mt-2">
                                <textarea className="input mb-2" placeholder="Your answer..."
                                  value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} rows="4" />
                                <FileUploader classroomId={classroomId}
                                  onUploaded={(f) => setSubmissionAttachments(prev => [...prev, f])} />
                                <Attachments attachments={submissionAttachments} />
                                <div className="flex gap-2 mt-2">
                                  <button className="btn btn--primary btn--sm" onClick={() => submitAssignment(a._id)}
                                    disabled={!submissionText.trim() && submissionAttachments.length === 0}>Submit</button>
                                  <button className="btn btn--ghost btn--sm" onClick={() => {
                                    setSubmittingId(null);
                                    setSubmissionText("");
                                    setSubmissionAttachments([]);
                                  }}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {assignments.length === 0 && <p className="text-muted">No assignments yet.</p>}
              </div>
            </div>
          )}

          {/* ===== NOTES TAB ===== */}
          {tab === "notes" && (
            <div>
              <h3 className="mb-3">Notes</h3>
              <div className="notes-list">
                {notes.map(n => (
                  <div key={n._id} className="note">
                    {editingId === n._id ? (
                      <div className="edit-form">
                        <input className="input mb-2" value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                        <textarea className="input mb-2" value={editBody}
                          onChange={(e) => setEditBody(e.target.value)} placeholder="Content" rows="4" />
                        <div className="flex gap-2">
                          <button className="btn btn--primary btn--sm" onClick={() => updateNote(n._id)}
                            disabled={!editTitle.trim()}>Save</button>
                          <button className="btn btn--ghost btn--sm" onClick={cancelEditing}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="note-title">
                          {n.title}
                          {canPost && (
                            <span className="flex gap-2" style={{ marginLeft: "auto" }}>
                              <button className="btn btn--ghost btn--sm" onClick={() => startEditing(n, "note")}>Edit</button>
                              <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => deleteNote(n._id)}>Delete</button>
                            </span>
                          )}
                        </div>
                        <p className="note-body">{n.body}</p>
                        <Attachments attachments={n.attachments || []} />
                      </>
                    )}
                  </div>
                ))}
                {notes.length === 0 && <p className="text-muted">No notes yet.</p>}
              </div>
            </div>
          )}

          {/* ===== ATTENDANCE TAB (teacher only) ===== */}
          {tab === "attendance" && canPost && (
            <AttendanceReportInline classroomId={classroomId} token={token} />
          )}

          {/* ===== MEMBERS TAB ===== */}
          {tab === "members" && (
            <MembersListInline classroomId={classroomId} token={token} user={user} />
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Inline Attendance Report Component =====
function AttendanceReportInline({ classroomId, token }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest(`/api/live/${classroomId}/sessions`, { token })
      .then(r => setSessions(r.sessions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classroomId, token]);

  async function loadAttendance(sessionId) {
    if (selectedSession === sessionId) { setSelectedSession(null); return; }
    try {
      const r = await apiRequest(`/api/live/session/${sessionId}/attendance`, { token });
      setAttendance(r.rows);
      setSelectedSession(sessionId);
    } catch { /* ignore */ }
  }

  function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  function downloadPDF(session) {
    const doc = new jsPDF();
    const sessionDate = new Date(session.startedAt).toLocaleDateString();
    const sessionTime = new Date(session.startedAt).toLocaleTimeString();

    doc.setFontSize(18);
    doc.setTextColor(67, 97, 238);
    doc.text("Attendance Report", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Session: ${sessionDate} at ${sessionTime}`, 14, 32);
    doc.text(`Status: ${session.status}`, 14, 38);
    if (session.endedAt) {
      doc.text(`Duration: ${formatDuration(new Date(session.endedAt) - new Date(session.startedAt))}`, 14, 44);
    }

    const tableRows = attendance.map((row, i) => [
      i + 1,
      row.userId?.name || "Unknown",
      row.userId?.email || "-",
      row.firstJoinAt ? new Date(row.firstJoinAt).toLocaleTimeString() : "-",
      formatDuration(row.totalMs || 0),
      (row.status || "pending").charAt(0).toUpperCase() + (row.status || "pending").slice(1)
    ]);

    autoTable(doc, {
      startY: session.endedAt ? 50 : 44,
      head: [["#", "Student", "Email", "First Join", "Duration", "Status"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [67, 97, 238], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 12 },
        5: { fontStyle: "bold" }
      },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 5) {
          const val = String(data.cell.raw).toLowerCase();
          if (val === "present") data.cell.styles.textColor = [22, 101, 52];
          else if (val === "absent") data.cell.styles.textColor = [153, 27, 27];
          else data.cell.styles.textColor = [133, 77, 14];
        }
      }
    });

    const present = attendance.filter(r => r.status === "present").length;
    const absent = attendance.filter(r => r.status === "absent").length;
    const pending = attendance.filter(r => r.status === "pending").length;
    const finalY = (doc.lastAutoTable?.finalY || 60) + 10;
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Summary: ${present} Present, ${absent} Absent, ${pending} Pending  |  Total: ${attendance.length} students`, 14, finalY);

    doc.save(`attendance-${sessionDate.replace(/\//g, "-")}.pdf`);
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <h3 className="mb-3">Attendance Reports</h3>
      {sessions.length === 0 ? (
        <p className="text-muted">No live sessions recorded yet.</p>
      ) : (
        <div className="attendance-sessions">
          {sessions.map(s => (
            <div key={s._id} className="attendance-session-card" onClick={() => loadAttendance(s._id)}>
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(s.startedAt).toLocaleDateString()} at {new Date(s.startedAt).toLocaleTimeString()}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                    Status: <span style={{ textTransform: "capitalize" }}>{s.status}</span>
                    {s.endedAt && ` | Duration: ${formatDuration(new Date(s.endedAt) - new Date(s.startedAt))}`}
                  </div>
                </div>
                <span style={{ color: "var(--primary)", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}>
                  {selectedSession === s._id ? "Hide" : "View Details"}
                </span>
              </div>

              {selectedSession === s._id && (
                <div className="attendance-table mt-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-2" style={{ fontSize: "0.85rem" }}>
                      <span className="attendance-badge attendance-badge--present">
                        {attendance.filter(r => r.status === "present").length} Present
                      </span>
                      <span className="attendance-badge attendance-badge--absent">
                        {attendance.filter(r => r.status === "absent").length} Absent
                      </span>
                      <span className="attendance-badge attendance-badge--pending">
                        {attendance.filter(r => r.status === "pending").length} Pending
                      </span>
                    </div>
                    {attendance.length > 0 && (
                      <button className="btn btn--primary btn--sm" onClick={() => downloadPDF(s)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4 }}>
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7 10L12 15L17 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 15V3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Download PDF
                      </button>
                    )}
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>First Join</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((row, i) => (
                        <tr key={row._id}>
                          <td>{i + 1}</td>
                          <td>
                            <div>{row.userId?.name || "Unknown"}</div>
                            <div className="text-muted" style={{ fontSize: "0.8rem" }}>{row.userId?.email}</div>
                          </td>
                          <td>{row.firstJoinAt ? new Date(row.firstJoinAt).toLocaleTimeString() : "-"}</td>
                          <td>{formatDuration(row.totalMs || 0)}</td>
                          <td>
                            <span className={`attendance-badge attendance-badge--${row.status}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {attendance.length === 0 && (
                        <tr><td colSpan="5" className="text-muted text-center">No attendance data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Inline Members List Component =====
function MembersListInline({ classroomId, token, user }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadMembers() {
    try {
      const r = await apiRequest(`/api/classrooms/${classroomId}/members`, { token });
      setMembers(r.members);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadMembers(); }, [classroomId]);

  async function removeMember(userId) {
    if (!confirm("Remove this member from the classroom?")) return;
    try {
      await apiRequest(`/api/classrooms/${classroomId}/members/${userId}`, { method: "DELETE", token });
      await loadMembers();
    } catch (e) { alert(e.message); }
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const teachers = members.filter(m => m.roleInClass === "teacher");
  const students = members.filter(m => m.roleInClass === "student");

  return (
    <div>
      <h3 className="mb-3">Members ({members.length})</h3>

      <h4 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Teachers ({teachers.length})</h4>
      <div className="members-list mb-3">
        {teachers.map(m => (
          <div key={m._id} className="member-card">
            <div className="member-info">
              <div className="member-avatar">{m.userId?.name?.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{m.userId?.name}</div>
                <div className="text-muted" style={{ fontSize: "0.85rem" }}>{m.userId?.email}</div>
              </div>
            </div>
            <span className="pill" style={{ fontSize: "0.75rem", padding: "4px 12px" }}>Teacher</span>
          </div>
        ))}
      </div>

      <h4 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Students ({students.length})</h4>
      <div className="members-list">
        {students.map(m => (
          <div key={m._id} className="member-card">
            <div className="member-info">
              <div className="member-avatar">{m.userId?.name?.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{m.userId?.name}</div>
                <div className="text-muted" style={{ fontSize: "0.85rem" }}>{m.userId?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                Joined {new Date(m.joinedAt).toLocaleDateString()}
              </span>
              {user?.role === "teacher" && (
                <button className="btn btn--ghost btn--sm"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                  onClick={() => removeMember(m.userId?._id)}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        {students.length === 0 && <p className="text-muted">No students yet.</p>}
      </div>
    </div>
  );
}
