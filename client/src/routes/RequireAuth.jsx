// src/routes/RequireAuth.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  console.log('GUARD', { loading, isAuthenticated });
  const location = useLocation();
  if (isAuthenticated) return <Outlet />;
  if (loading) return <div className="p-6">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/register" state={{ from: location }} replace />
  return <Outlet />;
}
