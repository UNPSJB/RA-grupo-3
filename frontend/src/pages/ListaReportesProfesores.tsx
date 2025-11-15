import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// ... (Interfaz ReporteProfesor no cambia) ...
interface ReporteProfesor { /* ... */ }
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ListaReportesProfesores: React.FC = () => {
  const [reportes, setReportes] = useState<ReporteProfesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token, logout }= useAuth();

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setLoading(false);
      setError("Necesitas iniciar sesión para ver tus reportes pendientes.");
      return;
    }

    const fetchReportes = async () => {
      setLoading(true);
      setError(null);
      setReportes([]);

      try {
        const response = await fetch(
          `${API_BASE_URL}/encuestas-abiertas/mis-instancias-activas-profesor`,
          {
            headers: {
              "Authorization": `Bearer ${token}` // <-- Corregido
            }
          }
        );

        if (!response.ok) {
          // ... (manejo de errores)
          if (response.status === 401 || response.status === 403) {
            setError("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
            logout();
            return;
          }
          // ...
          throw new Error("Error fetching");
        }

        const data: ReporteProfesor[] = await response.json();

        if (isMounted) {
          setReportes(data);
        }
      } catch (err) {
        // ... (manejo de errores)
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReportes();

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  // ... (Tu JSX no cambia) ...
  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      {/* ... (JSX) ... */}
    </div>
  );
};

export default ListaReportesProfesores;