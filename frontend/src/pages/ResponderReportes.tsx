import React, { useState, useMemo, useEffect } from 'react';
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

interface Seccion {
  id: number;
  nombre: string;
  preguntas: Pregunta[];
}

interface ReporteAcademico {
  id: number;
  titulo: string;
  descripcion: string;
  secciones: Seccion[];
}

const ResponderReportes: React.FC = () => {
  const [preguntas, setPreguntas] = useState<{ [key: number]: string | number }>({});
  const [reporte, setReporte] = useState<ReporteAcademico | null>(null);

  useEffect(() => {
    const fetchReporte = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/instrumentos/reportes-academicos/1`);
        const data = await response.json();
        setReporte(data);
      } catch (error) {
        console.error("Error fetching report: ", error);
      }
    };

    fetchReporte();
  }, []);

  const allPreguntas = useMemo(() => {
    if (!reporte) return [];
    return reporte.secciones.flatMap(seccion => seccion.preguntas);
  }, [reporte]);

  const isEncuestaCompleta = useMemo(() => {
    const multipleChoiceQuestions = allPreguntas.filter(
      (pregunta) => pregunta.tipo === "MULTIPLE_CHOICE"
    );

    return multipleChoiceQuestions.every((pregunta) => {
      const answer = preguntas[pregunta.id];
      return answer !== undefined && answer !== null && answer !== '';
    });
  }, [preguntas, allPreguntas]);

  if (!reporte) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{reporte.titulo}</h1>
      <p className="text-gray-600 mb-8">{reporte.descripcion}</p>
      {reporte.secciones.map(seccion => (
        <div key={seccion.id} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{seccion.nombre}</h2>
          {seccion.preguntas.map((pregunta) => (
            <ProfesorResponder
              key={pregunta.id}
              pregunta={pregunta}
              value={preguntas[pregunta.id]}
              onChange={(preguntaId, value) => {
                setPreguntas((prevAnswers) => ({
                  ...prevAnswers,
                  [preguntaId]: value,
                }));
              }}
            />
          ))}
        </div>
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
