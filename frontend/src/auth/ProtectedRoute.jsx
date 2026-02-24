import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth.js";

export default function ProtectedRoute({ children, role }) {
  const { token, user } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
