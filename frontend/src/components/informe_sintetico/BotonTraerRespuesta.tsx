import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";

interface Props {
  instanciaId: string;
  seccionPrefijo: string; // Ej: "1.", "2.A", etc.
  onCopy: (texto: string) => void; // Callback para enviar el texto al padre
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const BotonTraerRespuestas: React.FC<Props> = ({
  instanciaId,
  seccionPrefijo,
  onCopy,
}) => {
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<string>("");
  const { token } = useAuth();

  // Cargar el resumen automáticamente al montar el componente
  useEffect(() => {
    const fetchResumen = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/departamento/instancia/${instanciaId}/autocompletar?seccion_prefijo=${seccionPrefijo}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setResumen(
            data.texto_resumen ||
              "No hay respuestas disponibles de profesores para esta sección."
          );
        } else {
          setResumen("Error al obtener el resumen de los profesores.");
        }
      } catch (error) {
        console.error(error);
        setResumen("Error de conexión.");
      } finally {
        setLoading(false);
      }
    };

    if (instanciaId && token) {
      fetchResumen();
    }
  }, [instanciaId, seccionPrefijo, token]);

  if (loading)
    return (
      <div className="text-xs text-gray-500 animate-pulse mb-4">
        Cargando resumen de cátedras...
      </div>
    );

  // Si no hay resumen o está vacío, no mostramos nada para no ensuciar la UI
  if (!resumen || resumen.startsWith("No hay respuestas")) return null;

  return (
    <div className="mb-4 border border-amber-200 rounded-lg overflow-hidden bg-amber-50 shadow-sm">
      {/* Encabezado visual */}
      <div className="bg-amber-100 px-3 py-2 border-b border-amber-200 flex justify-between items-center">
        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
          Resumen de Informes de Cátedra
        </span>
      </div>

      {/* Área de Texto de Solo Lectura */}
      <div className="p-3">
        <textarea
          readOnly
          className="w-full h-32 p-2 text-sm text-gray-700 bg-white border border-amber-200 rounded focus:outline-none resize-y font-mono"
          value={resumen}
        />
      </div>

      {/* Botón Azul de Acción */}
      <div className="px-3 pb-3 flex justify-end">
        <button
          type="button"
          onClick={() => onCopy(resumen)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded shadow-sm transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
            />
          </svg>
          Copiar resumen a la respuesta
        </button>
      </div>
    </div>
  );
};
