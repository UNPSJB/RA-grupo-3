import React, { useState, useEffect, useMemo } from "react";
// 1. Importa el nuevo componente y los tipos
import CursadaResultados from "../components/estadisticas/CursadaResultados";
import type { ResultadoCursada } from "../types/estadisticas";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ResultadosProfesorPage: React.FC = () => {
  // 2. Usa el tipo de dato correcto
  const [resultados, setResultados] = useState<ResultadoCursada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. NUEVO ESTADO para saber qué cursada mostrar
  const [selectedCursadaId, setSelectedCursadaId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const fetchResultados = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/profesor/mis-resultados`);
        if (!response.ok) {
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
  }, []);

  // 4. Lógica para mostrar la vista de detalle
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

  // 5. VISTA DE DETALLE (si hay una cursada seleccionada)
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
      </div>
    );
  }

  // 6. VISTA DE LISTA (por defecto, como en tu captura)
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Mis Encuestas Finalizadas
      </h2>

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
