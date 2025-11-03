import React, { useState, useEffect } from "react";

interface EncuestaCerradaInfo {
  id: number;
  fecha_fin: string | null;
  plantilla: {
    titulo: string;
  };
  cursada?: {
    materia?: {
      nombre: String;
      };
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ResultadosProfesorPage: React.FC = () => {
  const [encuestas, setEncuestas] = useState<EncuestaCerradaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const data: EncuestaCerradaInfo[] = await response.json();
        setEncuestas(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchResultados();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Mis Encuestas Finalizadas
      </h2>

      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && encuestas.length === 0 && (
        <p>No hay encuestas finalizadas para mostrar.</p>
      )}

      {!loading && !error && encuestas.length > 0 && (
        <div className="space-y-3">
          {encuestas.map((enc) => (
            <div
              key={enc.id}
              className="bg-white p-4 rounded shadow border flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold">
                  {enc.plantilla?.titulo || "Sin Título"}
                </h3>
                <p className="text-sm text-gray-600">
                  Materia: {enc.cursada?.materia?.nombre || "N/A"}
                </p>
                <p className="text-xs text-gray-500">
                  Finalizada el:{" "}
                  {enc.fecha_fin
                    ? new Date(enc.fecha_fin).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                disabled
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
