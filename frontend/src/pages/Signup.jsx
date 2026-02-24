import React, { useState } from "react";
import { apiRequest } from "../api/api.js";
import { useAuth } from "../auth/useAuth.js";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const data = await apiRequest("/api/auth/signup", { method: "POST", body: form });
      login(data);
      nav("/");
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="container main">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="card__inner">
          <h1 className="h1 text-center">Create Account</h1>
          <p className="text-center text-muted mb-4">
            Join Classroom to start learning or teaching
          </p>
          
          {err && <div className="alert"><b>Error:</b> {err}</div>}

          <form className="form" onSubmit={submit}>
            <div className="field">
              <div className="label">Full Name</div>
              <input 
                className="input" 
                placeholder="Enter your full name" 
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="field">
              <div className="label">Email Address</div>
              <input 
                className="input" 
                type="email" 
                placeholder="Enter your email" 
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div className="field">
              <div className="label">Password</div>
              <input 
                className="input" 
                type="password" 
                placeholder="Create a strong password" 
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength="6"
              />
              <small className="text-muted" style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                Must be at least 6 characters long
              </small>
            </div>

            <div className="field">
              <div className="label">I am a...</div>
              <div className="flex gap-4" style={{ marginTop: "8px" }}>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={form.role === "student"}
                    onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                    style={{ marginRight: "8px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "600" }}>Student</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>Join classes and learn</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={form.role === "teacher"}
                    onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                    style={{ marginRight: "8px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "600" }}>Teacher</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>Create and manage classes</div>
                  </div>
                </label>
              </div>
            </div>

            <button className="btn btn--primary" type="submit" style={{ width: "100%", marginTop: "16px" }}>
              Create Account
            </button>
            
            <div className="text-center mt-4">
              <p className="text-muted">
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
 