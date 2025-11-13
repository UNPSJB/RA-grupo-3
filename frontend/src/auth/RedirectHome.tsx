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

  // --- CAMBIO: Actualizar el switch de redirección ---
  switch (role) {
    case "ALUMNO":
      return <Navigate to="/alumno" replace />;
    case "DOCENTE":
      return <Navigate to="/profesores" replace />;
    case "ADMIN_SECRETARIA": // <--- RENOMBRADO
      return <Navigate to="/secretaria" replace />;
    case "ADMIN_DEPARTAMENTO": // <--- AÑADIDO
      return <Navigate to="/departamento" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
  // --- FIN DEL CAMBIO ---
};

export default RedirectHome;