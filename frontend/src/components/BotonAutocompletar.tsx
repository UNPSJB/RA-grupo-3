import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";

interface Props {
  instanciaId: string; // ID del Informe Sintético
  seccionPrefijo: string; // "1.", "2.", "3.", etc.
  targetKey: string; // La key del estado donde se guardará el texto
  onSuccess: (key: string, text: string) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const BotonAutocompletar: React.FC<Props> = ({
  instanciaId,
  seccionPrefijo,
  targetKey,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleClick = async () => {
    if (
      !confirm(
        "Esto reemplazará el contenido actual con las respuestas de los profesores. ¿Continuar?"
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/departamento/instancia/${instanciaId}/autocompletar?seccion_prefijo=${seccionPrefijo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        onSuccess(targetKey, data.texto_resumen);
      } else {
        alert("Error al traer respuestas");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mb-2 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1 rounded border border-indigo-200 flex items-center gap-2 transition-colors"
    >
      {loading ? (
        <span>Cargando...</span>
      ) : (
        <>
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
          Traer respuestas de profesores
        </>
      )}
    </button>
  );
};
