import React, { useState, useMemo } from 'react';
import ProfesorResponder from "../components/ProfesorResponder.tsx"

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Opcion {
  id: number;
  texto: string;
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE";
  opciones?: Opcion[];
}

const ResponderReportes: React.FC = () => {
  const [preguntas, setPreguntas] = useState<{ [key: number]: string | number }>({});

  const MOCK_PREGUNTAS: Pregunta[] = [
    {
      id: 1,
      texto: "1. Describa las fortalezas pedagógicas observadas en la cursada.",
      tipo: "REDACCION"
    },
    {
      id: 2,
      texto: "2. ¿Cómo evaluaría la bibliografía proporcionada por la cátedra?",
      tipo: "MULTIPLE_CHOICE",
      opciones: [
        { id: 10, texto: "Muy Adecuada" },
        { id: 11, texto: "Adecuada" },
        { id: 12, texto: "Poco Adecuada" },
        { id: 13, texto: "Inexistente o Irrelevante" }
      ]
    },
    {
      id: 3,
      texto: "3. Comentarios adicionales o sugerencias de mejora.",
      tipo: "REDACCION"
    }
  ];

  const isEncuestaCompleta = useMemo(() => {
    const multipleChoiceQuestions = MOCK_PREGUNTAS.filter(
      (pregunta) => pregunta.tipo === "MULTIPLE_CHOICE"
    );

    return multipleChoiceQuestions.every((pregunta) => {
      const answer = preguntas[pregunta.id];
      // verifica si la pregunta existe y no es un str vacio (para input de texto)
      // para multiple choice, el valor deberia ser un numero (opcion.id creo)
      return answer !== undefined && answer !== null && answer !== '';
    });
  }, [preguntas, MOCK_PREGUNTAS]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">prueba de como responder reportes</h1>
      {MOCK_PREGUNTAS.map((pregunta) => (
        <ProfesorResponder
          key={pregunta.id}
          pregunta={pregunta}
          value={preguntas[pregunta.id]} // pasar al siguiente estado de respuesta
          onChange={(preguntaId, value) => {
            setPreguntas((prevAnswers) => ({
              ...prevAnswers,
              [preguntaId]: value,
            }));
          }}
        />
      ))}
      <div className="flex justify-end mt-4">
        <button
          className={`py-2 px-4 rounded font-bold ${
            isEncuestaCompleta
              ? "bg-blue-500 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isEncuestaCompleta}
          onClick={() => {
            // Manejador del envio de formulario
            console.log("Formulario completado:", preguntas);
            alert("Encuesta enviada.");
          }}
        >
          Completar
        </button>
      </div>
    </div>
  );
};

export default ResponderReportes;
