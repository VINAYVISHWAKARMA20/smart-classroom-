import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/api.js";
import { useAuth } from "../auth/useAuth.js";
import { Link } from "react-router-dom";

export default function TeacherDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdClassroom, setCreatedClassroom] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const d = await apiRequest("/api/dashboard/teacher", { token });
      setData(d);
    } catch (e) { 
      setErr(e.message); 
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createClassroom(e) {
    e.preventDefault();
    setErr("");
    try {
      const r = await apiRequest("/api/classrooms", { method: "POST", token, body: { name, description: desc } });
      setCreatedClassroom(r);
      setShowSuccess(true);
      setName(""); 
      setDesc("");
      await load();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (e) { setErr(e.message); }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
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
      {/* Dashboard Header */}
      <div className="classroom-header">
        <div>
          <h2>Teacher Dashboard</h2>
          <p className="text-muted mt-1">Manage your classrooms and track student progress</p>
        </div>
        {user && (
          <div className="pill">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 17H14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21L17.5 20L16 21L14.5 20L13 21L11.5 20L10 21L8.5 20L7 21L5.5 20L5 21Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 7H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 11H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <b>{user.name}</b> · Teacher
          </div>
        )}
      </div>
      
      {err && <div className="alert"><b>Error:</b> {err}</div>}

      {/* Success Message */}
      {showSuccess && createdClassroom && (
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01L9 11.01" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-green-800">Classroom Created Successfully!</div>
                <div className="text-sm text-green-600">Share the code below with your students</div>
              </div>
            </div>
            <button 
              onClick={() => setShowSuccess(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-sm text-green-700 mb-1">Join Code</div>
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-2 rounded border border-green-300 text-green-800 font-mono font-bold flex-1">
                  {createdClassroom.join.code}
                </code>
                <button 
                  onClick={() => copyToClipboard(createdClassroom.join.code)}
                  className="btn btn--ghost text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <div className="text-sm text-green-700 mb-1">Direct Link</div>
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-2 rounded border border-green-300 text-green-800 font-mono text-sm flex-1 truncate">
                  {window.location.origin}/join/{createdClassroom.join.linkToken}
                </code>
                <button 
                  onClick={() => copyToClipboard(`${window.location.origin}/join/${createdClassroom.join.linkToken}`)}
                  className="btn btn--ghost text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-value">{data?.classrooms?.length || 0}</div>
          <div className="stat-label">Active Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.assignmentsCount || 0}</div>
          <div className="stat-label">Assignments Posted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.studentsCount || 0}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.liveSessionsCount || 0}</div>
          <div className="stat-label">Live Sessions</div>
        </div>
      </div>

      {/* Create Classroom Section */}
      <div className="dashboard-section">
        <h3 className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Create New Classroom
        </h3>
        <p className="text-muted mb-4">Create a new virtual classroom and invite students to join.</p>
        
        <form onSubmit={createClassroom} className="grid gap-4">
          <div className="field">
            <div className="label">Classroom Name</div>
            <input 
              className="input" 
              placeholder="e.g., Mathematics 101, Advanced Physics, etc." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="field">
            <div className="label">Description (Optional)</div>
            <textarea 
              className="input" 
              placeholder="Brief description of what this class covers..." 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows="3"
            />
          </div>
          
          <button 
            className="btn btn--primary" 
            type="submit"
            disabled={!name}
            style={{ maxWidth: "200px" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "8px" }}>
              <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create Classroom
          </button>
        </form>
      </div>

      {/* My Classrooms Section */}
      <div className="dashboard-section mt-4">
        <div className="flex justify-between items-center mb-6">
          <h3>My Classrooms</h3>
          <span className="text-muted">{data?.classrooms?.length || 0} classrooms</span>
        </div>
        
        {data?.classrooms && data.classrooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.classrooms.map((c) => (
              <Link 
                key={c._id} 
                to={`/classroom/${c._id}`}
                className="card hover:shadow-lg transition-all duration-300"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card__inner">
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{ 
                      width: "48px", 
                      height: "48px", 
                      backgroundColor: "var(--primary-light)", 
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "700",
                      fontSize: "1.25rem"
                    }}>
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg truncate">{c.name}</div>
                      {c.studentCount && (
                        <div className="text-sm text-muted">
                          {c.studentCount} student{c.studentCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {c.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{c.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15V17M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {c.assignmentCount || 0} assignments
                    </div>
                    <div className="flex items-center text-primary font-semibold">
                      View Class
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: "4px" }}>
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div style={{ 
              width: "80px", 
              height: "80px", 
              backgroundColor: "var(--gray-100)", 
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 12H19" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-700 mb-2">No classrooms yet</h4>
            <p className="text-gray-500 max-w-md mx-auto">
              Create your first classroom above to start teaching. You'll get a join code to share with students.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="dashboard-section mt-4">
        <h3>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <button 
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 transition-all"
            onClick={() => window.open('/teacher/analytics', '_blank')}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21H6.2C5.0799 21 4.51984 21 4.09202 20.782C3.71569 20.5903 3.40973 20.2843 3.21799 19.908C3 19.4802 3 18.9201 3 17.8V3" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 8V15.2C21 16.8802 21 17.7202 20.673 18.362C20.3854 18.9265 19.9265 19.3854 19.362 19.673C18.7202 20 17.8802 20 16.2 20H7.8C6.11984 20 5.27976 20 4.63803 19.673C4.07354 19.3854 3.6146 18.9265 3.32698 18.362C3 17.7202 3 16.8802 3 15.2V8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11L10.4348 14.4348C10.6323 14.6323 10.7311 14.7311 10.8455 14.7684C10.9459 14.8011 11.0541 14.8011 11.1545 14.7684C11.2689 14.7311 11.3677 14.6323 11.5652 14.4348L13 13L17 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 11H16.01" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold">View Analytics</div>
              <div className="text-sm text-gray-500">Track student performance</div>
            </div>
          </button>
          
          <button 
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-warning hover:bg-orange-50 transition-all"
            onClick={() => window.open('/teacher/grades', '_blank')}
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15V17M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" stroke="#f8961e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 7V13" stroke="#f8961e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold">Grade Assignments</div>
              <div className="text-sm text-gray-500">{data?.assignmentsToGrade || 0} pending</div>
            </div>
          </button>
          
          <button 
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-success hover:bg-green-50 transition-all"
            onClick={() => window.open('/teacher/schedule', '_blank')}
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 2V6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 2V6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 10H21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold">Schedule Live</div>
              <div className="text-sm text-gray-500">Plan upcoming sessions</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}