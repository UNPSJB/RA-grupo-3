import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Spinner from "../components/Spinner";

/**
 * Este componente decide a dónde enviar al usuario cuando visita la ruta raíz "/".
 * - Si está cargando, muestra un spinner.
 * - Si no está logueado (sin token/rol), lo envía a "/login".
 * - Si está logueado, lo envía a su dashboard (panel) específico.
 */
const RedirectHome: React.FC = () => {
  const { isLoading, token, role } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  // Redirección basada en el rol
  switch (role) {
    case "ALUMNO":
      return <Navigate to="/alumno" replace />;
    case "DOCENTE":
      return <Navigate to="/profesores" replace />;
    // Asumo que "Secretaria" usa un rol como "ADMIN"
    case "ADMIN": 
      return <Navigate to="/secretaria" replace />;
    default:
      // Si tiene un rol desconocido, lo enviamos al login
      return <Navigate to="/login" replace />;
  }
};

export default RedirectHome;