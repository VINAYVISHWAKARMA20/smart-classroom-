import React, { useState } from "react";
import { apiRequest } from "../api/api.js";
import { useAuth } from "../auth/useAuth.js";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const data = await apiRequest("/api/auth/login", { method: "POST", body: form });
      login(data);
      nav("/");
    } catch (e) { setErr(e.message); }
  }

  return (

  <div className="container main">
    <h1 className="h1">Login</h1>
    {err && <div className="alert"><b>Error:</b> {err}</div>}

    <div className="card" style={{ maxWidth: 520 }}>
      <div className="card__inner">
        <form className="form" onSubmit={submit}>
          <div className="field">
            <div className="label">Email</div>
            <input className="input" placeholder="Email" value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div className="field">
            <div className="label">Password</div>
            <input className="input" type="password" placeholder="Password" value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          <button className="btn btn--primary" type="submit">Login</button>
        </form>
      </div>
    </div>
  </div>
);

}
