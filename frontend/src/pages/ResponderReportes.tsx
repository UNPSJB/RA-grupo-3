/*import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReporte = async () => {
      try {
        // TODO: Hardcoded report ID should be dynamic based on context/routing
        const response = await fetch(`${API_BASE_URL}/instrumentos/reportes-academicos/3`);
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
      const respuesta = preguntas[pregunta.id];
      return respuesta  !== undefined && respuesta  !== null && respuesta  !== '';
    });
  }, [preguntas, allPreguntas]);

  const handleSubmit = async () => {
    if (!isEncuestaCompleta || !reporte) {
      alert("Por favor, complete todas las preguntas de opción múltiple.");
      return;
    }

    setIsSubmitting(true);

    const respuestas = Object.entries(preguntas).map(([preguntaId, valor]) => {
      const pregunta = allPreguntas.find(p => p.id === parseInt(preguntaId));
      if (!pregunta) return null;

      if (pregunta.tipo === 'MULTIPLE_CHOICE') {
        return { pregunta_id: parseInt(preguntaId), opcion_id: valor as number };
      } else {
        return { pregunta_id: parseInt(preguntaId), texto: valor as string };
      }
    }).filter(Boolean);

    const payload = {
      respuestas: respuestas,
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reportes-abiertas/instancia/1/responder`, { // Hardcoded instancia_id
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Reporte enviado con éxito.");
        navigate('/profesores/home');
      } else {
        const errorData = await response.json();
        console.error("Error al enviar el reporte:", errorData);
        alert(`Error al enviar el reporte: ${errorData.detail || 'Por favor, intente de nuevo.'}`);
      }
    } catch (error) {
      console.error("Error de red o al enviar el reporte:", error);
      alert("Ocurrió un error de red. Por favor, verifique su conexión e intente de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            isEncuestaCompleta && !isSubmitting
              ? "bg-blue-500 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isEncuestaCompleta || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Enviando...' : 'Completar'}
        </button>
      </div>
    </div>
  );
};

export default ResponderReportes;*/

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface ResultadoOpcion {
  opcion_id: number;
  opcion_texto: string;
  cantidad: number;
}

interface ResultadoPregunta {
  pregunta_id: number;
  pregunta_texto: string;
  pregunta_tipo: "MULTIPLE_CHOICE" | "REDACCION";
  resultados_opciones: ResultadoOpcion[] | null;
  respuestas_texto: { texto: string }[] | null;
}

interface ResultadoSeccion {
  seccion_nombre: string;
  resultados_por_pregunta: ResultadoPregunta[];
}

interface Opcion {
  id: number;
  texto: string;
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE";
  opciones?: Opcion[];
  origen_datos?: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultadosEncuesta, setResultadosEncuesta] = useState<ResultadoSeccion[] | null>(null);
  const navigate = useNavigate();

  // 🔹 Cargar reporte
  useEffect(() => {
    const fetchReporte = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/instrumentos/reportes-academicos/3`);
        const data = await response.json();
        setReporte(data);
      } catch (error) {
        console.error("Error fetching report: ", error);
      }
    };
    fetchReporte();
  }, []);

  // 🔹 Cargar resultados de encuestas (para generar resumen)
  useEffect(() => {
    const fetchResultados = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/profesor/mis-resultados`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Error al obtener resultados de encuesta");
        const json = await res.json();
        const first = Array.isArray(json) && json.length > 0 ? json[0] : null;
        setResultadosEncuesta(first ? first.resultados_por_seccion : []);
      } catch (err) {
        console.error("Error cargando resultados encuesta:", err);
      }
    };
    fetchResultados();
  }, []);

  // 🔹 Generar resumen de texto a partir de resultados reales
  const generarResumen = (): string => {
    if (!resultadosEncuesta) return "";

    let resumen = "";
    resultadosEncuesta.forEach((seccion) => {
      seccion.resultados_por_pregunta.forEach((pregunta) => {
        if (pregunta.pregunta_tipo === "MULTIPLE_CHOICE" && pregunta.resultados_opciones) {
          const total = pregunta.resultados_opciones.reduce((sum, o) => sum + o.cantidad, 0);
          resumen += `Pregunta: ${pregunta.pregunta_texto}\n`;
          resumen += `Total de respuestas: ${total}\n`;
          pregunta.resultados_opciones.forEach((op) => {
            const porcentaje = total > 0 ? ((op.cantidad / total) * 100).toFixed(1) : "0.0";
            resumen += `- ${op.opcion_texto}: ${op.cantidad} respuestas (${porcentaje}%)\n`;
          });
          resumen += "\n";
        }
      });
    });

    return resumen.trim();
  };

  const resumenEncuesta = useMemo(() => generarResumen(), [resultadosEncuesta]);

  const allPreguntas = useMemo(() => {
    if (!reporte) return [];
    return reporte.secciones.flatMap(seccion => seccion.preguntas);
  }, [reporte]);

  const isEncuestaCompleta = useMemo(() => {
    const multipleChoiceQuestions = allPreguntas.filter(
      (pregunta) => pregunta.tipo === "MULTIPLE_CHOICE"
    );
    return multipleChoiceQuestions.every((pregunta) => {
      const respuesta = preguntas[pregunta.id];
      return respuesta !== undefined && respuesta !== null && respuesta !== '';
    });
  }, [preguntas, allPreguntas]);

  const handleChange = (preguntaId: number, value: string | number) => {
    setPreguntas((prev) => ({
      ...prev,
      [preguntaId]: value,
    }));
  };

  const handleCopyResumen = (preguntaId: number) => {
    if (resumenEncuesta) {
      setPreguntas((prev) => ({
        ...prev,
        [preguntaId]: resumenEncuesta,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!isEncuestaCompleta || !reporte) {
      alert("Por favor, complete todas las preguntas de opción múltiple.");
      return;
    }

    setIsSubmitting(true);

    const respuestas = Object.entries(preguntas).map(([preguntaId, valor]) => {
      const pregunta = allPreguntas.find(p => p.id === parseInt(preguntaId));
      if (!pregunta) return null;

      if (pregunta.tipo === 'MULTIPLE_CHOICE') {
        return { pregunta_id: parseInt(preguntaId), opcion_id: valor as number };
      } else {
        return { pregunta_id: parseInt(preguntaId), texto: valor as string };
      }
    }).filter(Boolean);

    const payload = { respuestas };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reportes-abiertas/instancia/1/responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Reporte enviado con éxito.");
        navigate('/profesores/home');
      } else {
        const errorData = await response.json();
        console.error("Error al enviar el reporte:", errorData);
        alert(`Error al enviar el reporte: ${errorData.detail || 'Por favor, intente de nuevo.'}`);
      }
    } catch (error) {
      console.error("Error de red o al enviar el reporte:", error);
      alert("Ocurrió un error de red. Por favor, verifique su conexión e intente de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!reporte) return <div>Cargando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{reporte.titulo}</h1>
      <p className="text-gray-600 mb-8">{reporte.descripcion}</p>

      {reporte.secciones.map(seccion => (
        <div key={seccion.id} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{seccion.nombre}</h2>

          {seccion.preguntas.map((pregunta) => (
            <div key={pregunta.id} className="mb-6 border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50">
              <p className="font-semibold mb-3 text-gray-800">{pregunta.texto}</p>

              {pregunta.tipo === "REDACCION" ? (
                <>
                  <textarea
                    value={(preguntas[pregunta.id] as string) || ""}
                    onChange={(e) => handleChange(pregunta.id, e.target.value)}
                    placeholder="Escriba su respuesta aquí..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none mb-3 focus:ring-2 focus:ring-blue-400"
                    rows={6}
                  />
                  {pregunta.origen_datos === "resultados_encuesta" && resumenEncuesta && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopyResumen(pregunta.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded-md text-sm transition-colors"
                      >
                        Copiar resumen a la respuesta
                      </button>
                    </div>
                  )}
                </>
              ) : (
                pregunta.opciones?.map((opcion) => (
                  <div key={opcion.id} className="flex items-center mb-2">
                    <input
                      type="radio"
                      id={`pregunta-${pregunta.id}-opcion-${opcion.id}`}
                      name={`pregunta-${pregunta.id}`}
                      value={opcion.id}
                      checked={preguntas[pregunta.id] === opcion.id}
                      onChange={() => handleChange(pregunta.id, opcion.id)}
                      className="mr-2 accent-blue-500"
                    />
                    <label htmlFor={`pregunta-${pregunta.id}-opcion-${opcion.id}`} className="text-gray-700">
                      {opcion.texto}
                    </label>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ))}

      <div className="flex justify-end mt-4">
        <button
          className={`py-2 px-4 rounded font-bold ${
            isEncuestaCompleta && !isSubmitting
              ? "bg-blue-500 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isEncuestaCompleta || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Enviando...' : 'Completar'}
        </button>
      </div>
    </div>
  );
};

export default ResponderReportes;





