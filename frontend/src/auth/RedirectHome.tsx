import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Spinner from "../components/Spinner";

const RedirectHome: React.FC = () => {
  const { isLoading, token, role } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  // --- CAMBIO: Lógica de redirección (RENOMBRAR) ---
  switch (role) {
    case "ALUMNO":
      return <Navigate to="/alumno" replace />;
    case "DOCENTE":
      return <Navigate to="/profesores" replace />;
    case "ADMIN_DEPARTAMENTO": // <--- Ruta principal de admin_dpto
      return <Navigate to="/departamento" replace />;
    case "ADMIN_SECRETARIA": // <--- Ruta futura para admin_secretaria
      return <Navigate to="/secretaria" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default RedirectHome;