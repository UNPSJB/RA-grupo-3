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
import ProfesorResponder from "../components/ProfesorResponder.tsx";

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

/* Tipos para los resultados que devuelve /profesor/mis-resultados */
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
type ResultadosResponse = {
  cursada_id: number;
  materia_nombre: string;
  cuatrimestre_info: string;
  cantidad_respuestas: number;
  resultados_por_seccion: ResultadoSeccion[];
}[];

const ResponderReportes: React.FC = () => {
  const [preguntas, setPreguntas] = useState<{ [key: number]: string | number }>({});
  const [reporte, setReporte] = useState<ReporteAcademico | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  /* Estados para 2.B (Resultados Generales) */
  const [is2BOpen, setIs2BOpen] = useState(false);
  const [resultados2B, setResultados2B] = useState<ResultadoSeccion[] | null>(null);
  const [loading2B, setLoading2B] = useState(false);
  const [error2B, setError2B] = useState<string | null>(null);

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

  /* Función para abrir 2.B y hacer fetch (solo la primera vez) */
  const toggle2B = async () => {
    const newOpen = !is2BOpen;
    setIs2BOpen(newOpen);

    if (newOpen && resultados2B === null) {
      setLoading2B(true);
      setError2B(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/profesor/mis-resultados`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} - ${text}`);
        }
        const json: ResultadosResponse = await res.json();
        // la API devuelve un array; tomamos el primer elemento (o [] si no hay)
        const first = Array.isArray(json) && json.length > 0 ? json[0] : null;
        setResultados2B(first ? first.resultados_por_seccion : []);
      } catch (err: any) {
        console.error("Error cargando resultados 2.B:", err);
        setError2B(err.message || "Error al cargar resultados.");
      } finally {
        setLoading2B(false);
      }
    }
  };

  if (!reporte) {
    return <div>Cargando...</div>;
  }

  /* Buscamos índice de la sección "2" para insertar 2.B justo después.
     Hacemos comparaciones tolerantes: "2", "2.", "2 -", "2 " o que empiece con "2" */
  const indexSeccion2 = reporte.secciones.findIndex(s => {
    const name = (s.nombre || '').toString().trim();
    return (
      name === '2' ||
      name === '2.' ||
      name.startsWith('2') // tolerante: si el nombre empieza con '2' lo consideramos la sección 2
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{reporte.titulo}</h1>
      <p className="text-gray-600 mb-8">{reporte.descripcion}</p>

      {reporte.secciones.map((seccion, index) => (
        <React.Fragment key={seccion.id}>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
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

          {/* Si este índice coincide con la sección 2 encontrada, insertamos 2.B justo aquí */}
          {index === indexSeccion2 && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl font-bold text-gray-800">2.B Resultados Generales</h2>
                <button
                  onClick={toggle2B}
                  className="text-sm px-3 py-1 border rounded text-gray-700"
                >
                  {is2BOpen ? 'Cerrar' : 'Abrir'}
                </button>
              </div>

              {is2BOpen && (
                <>
                  {loading2B && <p className="text-gray-500">Cargando estadísticas...</p>}
                  {error2B && <p className="text-red-500">Error: {error2B}</p>}

                  {!loading2B && !error2B && resultados2B !== null && resultados2B.length === 0 && (
                    <p className="text-gray-500">No hay resultados disponibles.</p>
                  )}

                  {!loading2B && !error2B && resultados2B && resultados2B.length > 0 && (
                    <div className="space-y-6">
                      {resultados2B.map((resSeccion, sIdx) => (
                        <div key={sIdx}>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            {resSeccion.seccion_nombre}
                          </h3>

                          {resSeccion.resultados_por_pregunta.map((resPregunta) => (
                            <div key={resPregunta.pregunta_id} className="mb-4 ml-2">
                              <p className="font-medium text-gray-800">
                                {resPregunta.pregunta_texto}
                              </p>

                              {resPregunta.pregunta_tipo === 'MULTIPLE_CHOICE' && resPregunta.resultados_opciones && (
                                <ul className="list-disc ml-6 text-gray-700">
                                  {(() => {
                                    const total = resPregunta.resultados_opciones!.reduce(
                                      (sum, opt) => sum + (opt.cantidad || 0),
                                      0
                                    );
                                    return resPregunta.resultados_opciones!.map((opt) => {
                                      const porcentaje = total > 0
                                        ? ((opt.cantidad / total) * 100).toFixed(1)
                                        : "0.0";
                                      return (
                                        <li key={opt.opcion_id}>
                                          {opt.opcion_texto} — {opt.cantidad} respuestas ({porcentaje}%)
                                        </li>
                                      );
                                    });
                                  })()}
                                  {/* Mostrar total de respuestas por pregunta (si querés) */}
                                  <li className="mt-1 text-sm text-gray-500">
                                    Total respuestas reportadas: {resPregunta.resultados_opciones!.reduce((s, o) => s + o.cantidad, 0)}
                                  </li>
                                </ul>
                              )}

                              {resPregunta.pregunta_tipo === 'REDACCION' && (
                                <>
                                  {resPregunta.respuestas_texto && resPregunta.respuestas_texto.length > 0 ? (
                                    <ul className="list-disc ml-6 text-gray-700">
                                      {resPregunta.respuestas_texto.map((rt, i) => (
                                        <li key={i} className="mb-1">"{rt.texto}"</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-500 ml-2">Sin respuestas de texto.</p>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </React.Fragment>
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


