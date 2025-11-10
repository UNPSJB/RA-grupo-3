import React, { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface ResultadoOpcion {
  opcion: string;
  cantidad: number;
}

interface ResultadoPregunta {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE";
  opciones?: ResultadoOpcion[];
  respuestas_texto?: string[];
}

interface ResultadoSeccion {
  nombre: string;
  preguntas: ResultadoPregunta[];
}

const ResultadosGenerales: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ResultadoSeccion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleOpen = async () => {
    setIsOpen(!isOpen);

    if (!isOpen && !data) {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/profesor/mis-resultados`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Error al obtener resultados");
        const json = await res.json();
        setData(json.resultados_por_seccion || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <button
        className="w-full text-left text-2xl font-bold text-gray-800 mb-4 flex justify-between items-center"
        onClick={toggleOpen}
      >
        <span>2.B Resultados Generales (Estadísticas de los alumnos)</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          {isLoading && <p className="text-gray-500">Cargando estadísticas...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {data && data.length > 0 && (
            <div className="space-y-6">
              {data.map((seccion, i) => (
                <div key={i}>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">{seccion.nombre}</h3>
                  {seccion.preguntas.map((pregunta) => (
                    <div key={pregunta.id} className="ml-4 mb-4">
                      <p className="font-medium text-gray-800">{pregunta.texto}</p>
                      {pregunta.tipo === "MULTIPLE_CHOICE" && pregunta.opciones && (
                        <ul className="list-disc ml-6 text-gray-700">
                          {(() => {
                            const total = pregunta.opciones.reduce(
                              (sum, opt) => sum + opt.cantidad,
                              0
                            );
                            return pregunta.opciones.map((opt, idx) => {
                              const porcentaje =
                                total > 0
                                  ? ((opt.cantidad / total) * 100).toFixed(1)
                                  : "0.0";
                              return (
                                <li key={idx}>
                                  {opt.opcion}: {opt.cantidad} respuestas ({porcentaje}%)
                                </li>
                              );
                            });
                          })()}
                        </ul>
                      )}

                      {pregunta.tipo === "REDACCION" && (
                        <p className="text-gray-600 ml-2">
                          Respuestas de texto:{" "}
                          {pregunta.respuestas_texto
                            ? pregunta.respuestas_texto.length
                            : 0}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {!isLoading && !error && data && data.length === 0 && (
            <p className="text-gray-500">No hay resultados disponibles.</p>
          )}
        </>
      )}
    </div>
  );
};

export default ResultadosGenerales;
