// frontend/src/components/informe_sintetico/BotonTraerRespuesta.tsx
import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

interface Props {
  instanciaId: string;
  seccionPrefijo: string;
  materiaId?: number; // Opcional: si se pasa, busca solo de esa materia
  onCopy: (texto: string) => void;
  mini?: boolean; // Para mostrar versión ícono pequeño
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const BotonTraerRespuestas: React.FC<Props> = ({
  instanciaId,
  seccionPrefijo,
  materiaId,
  onCopy,
  mini = false,
}) => {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleClick = async () => {
    setLoading(true);
    try {
      // Construir URL con materia_id si existe
      let url = `${API_BASE_URL}/departamento/instancia/${instanciaId}/autocompletar?seccion_prefijo=${seccionPrefijo}`;
      if (materiaId) {
        url += `&materia_id=${materiaId}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.texto_resumen) {
          onCopy(data.texto_resumen);
        } else {
          alert("El profesor no escribió comentarios en esta sección.");
        }
      } else {
        alert("Error al consultar respuestas.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (mini) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title="Traer respuesta del profesor"
        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mb-2 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1 rounded border border-indigo-200 flex items-center gap-2 transition-colors"
    >
      {/* ... Icono y texto normal ... */}
      <span>{loading ? "Cargando..." : "Traer respuestas de profesores"}</span>
    </button>
  );
};
