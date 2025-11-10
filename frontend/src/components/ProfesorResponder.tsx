import React, { useState } from "react";

// --- Tipos de Datos (basados en el Backend) ---

/**
 * Corresponde a 'Opcion' en 'pregunta/schemas.py'
 */
export interface Opcion {
  id: number;
  texto: string;
}

/**
 * Corresponde a 'TipoPregunta' en 'enumerados.py'
 */
export type TipoPregunta = "REDACCION" | "MULTIPLE_CHOICE";

/**
 * Corresponde a 'Pregunta' en 'pregunta/schemas.py'
 */
export interface Pregunta {
  id: number;
  texto: string;
  tipo: TipoPregunta;
  opciones?: Opcion[]; // Opcional, solo para MULTIPLE_CHOICE
}

// --- Props del Componente ---

export interface PreguntaProfesorAccordionProps {
  pregunta: Pregunta;
  /** El valor actual de la respuesta (ID de opción o texto) */
  value: string | number | undefined;
  /** Función para notificar al componente padre de un cambio */
  onChange: (preguntaId: number, value: string | number) => void;
}

/**
 * Un componente de tipo "acordeón" para una sola pregunta.
 * Muestra el texto de la pregunta y, al hacer clic, revela
 * un <textarea> o una lista de <input type="radio"> según el tipo.
 */
const PreguntaProfesorAccordion: React.FC<PreguntaProfesorAccordionProps> = ({
  pregunta,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Renderiza el input adecuado (redacción o multiple choice)
   */
  const renderInput = () => {
    switch (pregunta.tipo) {
      case "REDACCION":
        return (
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            rows={5}
            placeholder="Escriba su respuesta aquí..."
            value={typeof value === "string" ? value : ""}
            // Notifica al padre en cada cambio
            onChange={(e) => onChange(pregunta.id, e.target.value)}
            // Evita que el clic en el textarea cierre el acordeón
            onClick={(e) => e.stopPropagation()}
          />
        );

      case "MULTIPLE_CHOICE":
        if (!pregunta.opciones || pregunta.opciones.length === 0) {
          return (
            <p className="text-red-500">
              Error: No se proporcionaron opciones para esta pregunta.
            </p>
          );
        }
        return (
          <div className="space-y-3">
            {pregunta.opciones.map((opcion) => (
              <label
                key={opcion.id}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-blue-50 transition-colors"
                // Evita que el clic en el label cierre el acordeón
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="radio"
                  name={`pregunta-${pregunta.id}`}
                  value={opcion.id}
                  checked={value === opcion.id}
                  onChange={() => onChange(pregunta.id, opcion.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-700">{opcion.texto}</span>
              </label>
            ))}
          </div>
        );

      default:
        // Maneja cualquier tipo de pregunta no esperado
        return (
          <p className="text-red-500">
            Error: Tipo de pregunta no soportado ({pregunta.tipo})
          </p>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 transition-all duration-300">
      {/* --- Barra Clickeable (Header del Acordeón) --- */}
      <button
        type="button"
        className="flex justify-between items-center w-full p-5 text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="flex items-center">
          <span className="w-5 h-5 mr-2 flex items-center justify-center">
            {" "}
            {/* Container for the tick */}
            {value !== undefined && value !== "" && (
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            )}
          </span>
          <span className="text-base font-medium text-gray-800">
            {pregunta.texto}
            {pregunta.tipo === "MULTIPLE_CHOICE" && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </span>
        </span>
        {/* Icono de Flecha (Chevron) */}
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>{" "}
      </button>

      {/* --- Contenido Desplegable --- */}
      {isOpen && (
        <div className="p-5 border-t border-gray-200 bg-gray-50">
          {renderInput()}
        </div>
      )}
    </div>
  );
};

export default PreguntaProfesorAccordion;
