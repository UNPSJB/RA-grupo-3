import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface ReporteProfesor {
  instancia_id: number;
  plantilla: {
    titulo: string;
    descripcion?: string;
  };
  materia_nombre?: string;
  fecha_fin?: string;
  ha_respondido: boolean;
}

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
              "Authorization": `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
            logout();
            return;
          }
          let errorDetail = `Error ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) {}
          throw new Error(errorDetail);
        }

        const data: ReporteProfesor[] = await response.json();

        if (isMounted) {
          setReportes(data);
        }
      } catch (err) {
        console.error("Error fetching reportes:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los reportes."
          );
        }
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

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center border-b pb-4 border-gray-300">
        Reportes Académicos
      </h2>
      {loading && (
        <div className="text-center py-10 text-gray-500 animate-pulse">
          <p>Cargando reportes disponibles...</p>
        </div>
      )}
      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md text-center"
          role="alert"
        >
          <p className="font-bold">¡Error al cargar!</p>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && reportes.length === 0 && (
        <div className="text-center py-10 text-gray-600 bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xl font-semibold mt-4">¡Todo al día!</p>
          <p className="text-base mt-2 text-gray-500">
            No tienes reportes académicos pendientes por responder en este momento.
          </p>
        </div>
      )}
      {!loading && !error && reportes.length > 0 && (
        <div className="space-y-4">
          {reportes.map((reporte) => (
            <div
              key={reporte.instancia_id}
              className="bg-white p-5 rounded-lg shadow border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-lg hover:border-indigo-300 transition-all duration-200 ease-in-out"
            >
              <div className="mb-4 sm:mb-0 sm:mr-4 flex-grow">
                <h3 className="text-xl font-semibold text-indigo-700 mb-1 hover:text-indigo-800 transition-colors">
                  {reporte.plantilla.titulo}
                </h3>
                {reporte.materia_nombre && (
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Materia: <span className="font-normal">{reporte.materia_nombre}</span>
                  </p>
                )}
                {reporte.plantilla.descripcion && (
                  <p className="text-sm text-gray-500 mt-1 italic">
                    "{reporte.plantilla.descripcion}"
                  </p>
                )}
                {reporte.fecha_fin && (
                  <p className="text-xs text-red-700 mt-2 font-semibold bg-red-100 px-2 py-1 rounded inline-flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Disponible hasta:{" "}
                    {new Date(reporte.fecha_fin).toLocaleDateString()} a las{" "}
                    {new Date(reporte.fecha_fin).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
              <div className="w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0">
                {reporte.ha_respondido ? (
                  <div className="w-full sm:w-auto inline-block text-center bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-lg shadow-inner border border-gray-300">
                    Reporte Respondido
                  </div>
                ) : (
                  <Link
                    to={`/profesor/reportes/instancia/${reporte.instancia_id}/responder`}
                    className="w-full sm:w-auto inline-block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Responder Reporte →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaReportesProfesores;
