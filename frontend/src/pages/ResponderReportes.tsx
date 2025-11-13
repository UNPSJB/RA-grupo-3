
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ResumenEncuesta from "../components/estadisticas/ResumenEncuesta";
import { useAuth } from "../auth/AuthContext";

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
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const [preguntas, setPreguntas] = useState<{
    [key: number]: string | number;
  }>({});
  const resumenRef = useRef<string>("");
  const [reporte, setReporte] = useState<ReporteAcademico | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultadosEncuesta, setResultadosEncuesta] = useState<
    ResultadoSeccion[] | null
  >(null);

  const [reporteCompletado, setReporteCompletado] = useState(false);

  const navigate = useNavigate();

  const { token, logout } = useAuth();

  useEffect(() => {
    if (!token) {
      console.error("No hay token, no se puede cargar el reporte.");
      return; 
    }
    const fetchReporte = async () => {
      if (!instanciaId) {
        console.error("No se proporcionó ID de instancia");
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/encuestas-abiertas/reporte/instancia/${instanciaId}/detalles`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
          }
          const errData = await response.json();
          throw new Error(errData.detail || `Error ${response.status}`);
        }

        const data = await response.json();
        setReporte(data);
      } catch (error) {
        console.error("Error fetching report: ", error);
      }
    };
    fetchReporte();
  }, [instanciaId, token, logout]);

  useEffect(() => {
    if (!token) {
      console.error("No hay token, no se pueden cargar los resultados.");
      return;
    }
    const fetchResultados = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/profesor/mis-resultados`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {if (res.status === 401 || res.status === 403) {
            logout();
          }
          throw new Error("Error al obtener resultados de encuesta");
        }
        const json = await res.json();
        const first = Array.isArray(json) && json.length > 0 ? json[0] : null;
        setResultadosEncuesta(first ? first.resultados_por_seccion : []);
      } catch (err) {
        console.error("Error cargando resultados encuesta:", err);
      }
    };
    fetchResultados();
  }, [token, logout]);
  
  const handleResumenGenerado=(texto: string) => {
    resumenRef.current = texto;
  }

  const allPreguntas = useMemo(() => {
    if (!reporte) return [];
    return reporte.secciones.flatMap((seccion) => seccion.preguntas);
  }, [reporte]);

  const isEncuestaCompleta = useMemo(() => {
    const multipleChoiceQuestions = allPreguntas.filter(
      (pregunta) => pregunta.tipo === "MULTIPLE_CHOICE"
    );
    return multipleChoiceQuestions.every((pregunta) => {
      const respuesta = preguntas[pregunta.id];
      return respuesta !== undefined && respuesta !== null && respuesta !== "";
    });
  }, [preguntas, allPreguntas]);

  const handleChange = (preguntaId: number, value: string | number) => {
    setPreguntas((prev) => ({
      ...prev,
      [preguntaId]: value,
    }));
  };


  const handleCopyResumen = (preguntaId: number) => {
    const resumenTexto = resumenRef.current;
    if (resumenTexto) {
      setPreguntas((prev) => ({
        ...prev,
        [preguntaId]: resumenTexto,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      alert("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
      logout();
      return;
    }
    if (!isEncuestaCompleta || !reporte) {
      alert("Por favor, complete todas las preguntas de opción múltiple.");
      return;
    }
    if (!instanciaId) {
      alert("Error: No se encontró el ID del reporte.");
      return;
    }

    setIsSubmitting(true);

    const respuestas = Object.entries(preguntas)
      .map(([preguntaId, valor]) => {
        const pregunta = allPreguntas.find(
          (p) => p.id === parseInt(preguntaId)
        );
        if (!pregunta) return null;

        if (pregunta.tipo === "MULTIPLE_CHOICE") {
          return {
            pregunta_id: parseInt(preguntaId),
            opcion_id: valor as number,
          };
        } else {
          return { pregunta_id: parseInt(preguntaId), texto: valor as string };
        }
      })
      .filter(Boolean);

    const payload = { respuestas };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/reportes-abiertas/instancia/${instanciaId}/responder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        setReporteCompletado(true);
      } else {
        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }
        const errorData = await response.json();
        console.error("Error al enviar el reporte:", errorData);
        alert(
          `Error al enviar el reporte: ${
            errorData.detail || "Por favor, intente de nuevo."
          }`
        );
      }
    } catch (error) {
      console.error("Error de red o al enviar el reporte:", error);
      alert(
        "Ocurrió un error de red. Por favor, verifique su conexión e intente de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizado 
  if (reporteCompletado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            ¡Reporte enviado correctamente!
          </h3>
          <p className="text-gray-600 mb-4">
            Gracias por completar el informe.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/profesores/reportes")} // Ruta actualizada
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Ver reportes pendientes
            </button>
            <button
              onClick={() => navigate("/profesores")} // Ruta actualizada
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reporte) {
    // Si la carga falla (o está cargando), muestra esto
    return <div className="text-center p-10">Cargando reporte...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {reporte.titulo}
      </h1>
      <p className="text-gray-600 mb-8">{reporte.descripcion}</p>

      {reporte.secciones.map((seccion) => (
        <div
          key={seccion.id}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {seccion.nombre}
          </h2>

          {seccion.preguntas.map((pregunta) => (
            <div
              key={pregunta.id}
              className="mb-6 border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50"
            >
              <p className="font-semibold mb-3 text-gray-800">
                {pregunta.texto}
              </p>

              {pregunta.tipo === "REDACCION" ? (
                <>
                  <textarea
                    value={(preguntas[pregunta.id] as string) || ""}
                    onChange={(e) => handleChange(pregunta.id, e.target.value)}
                    placeholder="Escriba su respuesta aquí..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none mb-3 focus:ring-2 focus:ring-blue-400"
                    rows={6}
                  />
                  {pregunta.origen_datos === "resultados_encuesta" && (
                    <div className="flex justify-end">
                      <ResumenEncuesta
                        resultadosEncuesta={resultadosEncuesta}
                        onGenerarResumen={handleResumenGenerado}
                      />
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
                    <label
                      htmlFor={`pregunta-${pregunta.id}-opcion-${opcion.id}`}
                      className="text-gray-700"
                    >
                      {opcion.texto}
                    </label>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ))}

      {/* === 4. AQUÍ ESTABA EL ERROR DE SINTAXIS === */}
      <div className="flex justify-end mt-4">
        <button
          className={`py-2 px-4 rounded font-bold ${
            isEncuestaCompleta && !isSubmitting
              ? "bg-blue-500 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed" // 👈 FALTABA ESTE ':'
          }`}
          disabled={!isEncuestaCompleta || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Enviando..." : "Completar"}
        </button>
      </div>
    </div>
  );
};

export default ResponderReportes;
