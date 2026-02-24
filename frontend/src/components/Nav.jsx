import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <div className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand">
          <span className="brand__dot" />
          Classroom MVP
        </Link>

        <div className="navlinks">
          <Link className="navlink" to="/">Home</Link>
          {user?.role === "teacher" && <Link className="navlink" to="/teacher">Teacher</Link>}
          {user?.role === "student" && <Link className="navlink" to="/student">Student</Link>}
        </div>

        <div className="navright">
          {user ? (
            <>
              <span className="pill">
                <b>{user.name}</b> · {user.role}
              </span>
              <button className="btn btn--ghost" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn" to="/login">Login</Link>
              <Link className="btn btn--primary" to="/signup">Signup</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
