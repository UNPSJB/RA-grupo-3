import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Spinner from "../components/Spinner";

// --- CAMBIO: Actualizar los roles permitidos ---
interface ProtectedRouteProps {
  allowedRoles: Array<"ALUMNO" | "DOCENTE" | "ADMIN_SECRETARIA" | "ADMIN_DEPARTAMENTO">;
}
// --- FIN DEL CAMBIO ---

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner />;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Falla la autorización y redirige a la raíz
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Éxito: tiene token y el rol es correcto
  return <Outlet />;
};

export default ProtectedRoute;