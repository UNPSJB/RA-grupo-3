import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Spinner from "../components/Spinner"; // Asumo que tienes un Spinner

interface ProtectedRouteProps {
  allowedRoles: Array<"ALUMNO" | "DOCENTE" | "ADMIN">;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Muestra un spinner mientras se verifica el token
    return <Spinner />;
  }

  if (!token) {
    // No hay token, redirige al login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Hay token, pero el rol no es el correcto
    // Redirige al Home (o a una página de "No Autorizado")
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Si tiene token y el rol es correcto, muestra el contenido
  return <Outlet />;
};

export default ProtectedRoute;