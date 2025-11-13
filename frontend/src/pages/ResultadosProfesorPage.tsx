import React, { useState, useEffect, useMemo } from "react";
import CursadaResultados from "../components/estadisticas/CursadaResultados";
import type { ResultadoCursada } from "../types/estadisticas";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ResultadosProfesorPage: React.FC = () => {
  const [resultados, setResultados] = useState<ResultadoCursada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCursadaId, setSelectedCursadaId] = useState<number | null>(
    null
  );
  const navigate = useNavigate();

  // Obtenemos el token y logout desde el Contexto (¡esto es lo correcto!)
  const { token, logout } = useAuth();

  // --- CAMBIO DENTRO DE useEffect ---
  useEffect(() => {
    // 1. Si no hay token del contexto, no hacemos nada. (Esto está bien)
    if (!token) {
      setLoading(false);
      setError("Necesitas iniciar sesión para ver tus resultados.");
      return;
    }

    const fetchResultados = async () => {
      setLoading(true);
      setError(null);
      try {
        // 2. ¡ELIMINAMOS ESTA LÍNEA! No la necesitamos.
        // const token = localStorage.getItem("token"); 

        const response = await fetch(
          `${API_BASE_URL}/profesor/mis-resultados`,
          {
            headers: {
              // 3. Usamos el 'token' del hook useAuth()
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
            logout();
            return;
          }
          throw new Error(
            `Error ${response.status}: No se pudieron cargar los resultados.`
          );
        }
        const data: ResultadoCursada[] = await response.json();
        setResultados(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchResultados();
  }, [token, logout]); // 4. Las dependencias son correctas.
  // --- FIN DEL CAMBIO ---

  const selectedResultado = useMemo(() => {
    if (!selectedCursadaId) return null;
    return resultados.find((r) => r.cursada_id === selectedCursadaId) || null;
  }, [selectedCursadaId, resultados]);

  // ----- RENDERIZADO -----

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-10 text-gray-500 animate-pulse">
          <p>Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md text-center"
          role="alert"
        >
          <p className="font-bold">¡Error al cargar!</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // --- VISTA DETALLADA DE UN RESULTADO ---
  if (selectedResultado) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => setSelectedCursadaId(null)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          &larr; Volver al listado
        </button>
        <CursadaResultados resultado={selectedResultado} />

        {selectedResultado.informe_curricular_instancia_id && (
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={() =>
                navigate(
                  `/profesores/reportes/instancia/${selectedResultado.informe_curricular_instancia_id}/responder`
                )
              }
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
            >
              Crear Informe de Actividad Curricular
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- VISTA DE LISTA DE RESULTADOS ---
  // (Aquí está el mensaje que recuerdas)
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {resultados.length === 0 && (
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
          <p className="text-xl font-semibold mt-4">Sin resultados</p>
          <p className="text-base mt-2 text-gray-500">
            No tienes encuestas cerradas con resultados para mostrar.
          </p>
        </div>
      )}

      {resultados.length > 0 && (
        <div className="space-y-3">
          {resultados.map((enc) => (
            <div
              key={enc.cursada_id}
              className="bg-white p-4 rounded shadow border flex flex-col sm:flex-row justify-between items-start sm:items-center"
            >
              <div className="mb-3 sm:mb-0">
                <h3 className="text-lg font-semibold text-gray-800">
                  {enc.materia_nombre || "Sin Título"}
                </h3>
                <p className="text-sm text-gray-600">
                  {enc.cuatrimestre_info || "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Respuestas: {enc.cantidad_respuestas}
                </p>
              </div>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600 w-full sm:w-auto"
                onClick={() => setSelectedCursadaId(enc.cursada_id)}
              >
                Ver Resultados
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultadosProfesorPage;