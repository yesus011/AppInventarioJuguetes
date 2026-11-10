import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ allowedRoles }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="page-loading">Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/inventory" replace />;
  return <Outlet />;
}