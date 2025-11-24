import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ResumenEncuesta from "../components/estadisticas/ResumenEncuesta";
import { useAuth } from "../auth/AuthContext";
import BarraProgreso from "../components/estadisticas/BarraProgreso";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- Interfaces ---

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

interface PlantillaReporte {
  id: number;
  titulo: string;
  descripcion: string;
  secciones: Seccion[];
  materia_nombre: string;
  comision_nombre: string;
  anio: number;
}

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

const ResponderReportes: React.FC = () => {
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout } = useAuth();

  // --- Estados de Datos ---
  const [plantilla, setPlantilla] = useState<PlantillaReporte | null>(null);
  const [respuestas, setRespuestas] = useState<{
    [key: number]: string | number;
  }>({});
  const [resultadosEncuesta, setResultadosEncuesta] = useState<
    ResultadoSeccion[] | null
  >(null);

  // --- Estados de UI ---
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [reporteCompletado, setReporteCompletado] = useState(false);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [errorPreguntaId, setErrorPreguntaId] = useState<number | null>(null);
  const [resumenParaCopiar, setResumenParaCopiar] = useState<string>("");

  // --- Datos de Cursada (Header) ---
  const stateData = location.state as {
    materiaNombre?: string;
    profesorNombre?: string;
    anio?: number;
  } | null;

  // --- Carga del Reporte (API Real) ---
  useEffect(() => {
    if (!token) {
      console.error("No hay token, no se puede cargar el reporte.");
      return;
    }
    let isMounted = true;
    const fetchReporte = async () => {
      setLoading(true);
      setMensaje(null);
      setPlantilla(null);
      setErrorPreguntaId(null);

      if (!instanciaId) {
        setMensaje("No se proporcionó ID de instancia");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/encuestas-abiertas/reporte/instancia/${instanciaId}/detalles`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
            return;
          }
          const errData = await response.json();
          if (response.status === 404) {
            setMensaje("El reporte no se encontró o ya no está activo.");
          } else {
            setMensaje(errData.detail || `Error ${response.status}`);
          }
          throw new Error(errData.detail || `Error ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          setPlantilla(data);
        }
      } catch (error) {
        console.error("Error fetching report: ", error);
        if (isMounted && !mensaje) {
          setMensaje(
            `Error al cargar el reporte: ${
              error instanceof Error ? error.message : "Error desconocido"
            }`
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchReporte();

    return () => {
      isMounted = false;
    };
  }, [instanciaId, token, logout]);

  // --- Carga de Resultados de Encuesta (API Real) ---
  useEffect(() => {
    if (!token) return;
    const fetchResultados = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profesor/mis-resultados`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
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

  // --- Lógica de Validación ---

  // Verifica si una sección específica está completa (todas las obligatorias respondidas)
  const isStepComplete = (index: number) => {
    if (!plantilla) return false;
    const seccion = plantilla.secciones[index];
    if (!seccion) return false;

    // Filtramos las preguntas obligatorias (En este caso, las MULTIPLE_CHOICE)
    const obligatorias = seccion.preguntas.filter(
      (p) => p.tipo === "MULTIPLE_CHOICE"
    );

    return obligatorias.every((p) => {
      const val = respuestas[p.id];
      return val !== undefined && val !== "" && val !== null;
    });
  };

  // Verifica si se permite navegar a una pestaña destino
  const canNavigateToStep = (targetIndex: number) => {
    // Siempre se puede ir al inicio o volver atrás
    if (targetIndex <= activeTab) return true;

    // Para avanzar, todas las secciones anteriores a la destino deben estar completas
    for (let i = 0; i < targetIndex; i++) {
      if (!isStepComplete(i)) return false;
    }
    return true;
  };

  // --- Handlers ---

  const handleChange = (preguntaId: number, value: string | number) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: value }));
    if (errorPreguntaId === preguntaId) {
      setErrorPreguntaId(null);
      setMensaje(null);
    }
  };

  const handleCopyResumen = (preguntaId: number) => {
    if (resumenParaCopiar) {
      handleChange(preguntaId, resumenParaCopiar);
    }
  };

  const handleNext = () => {
    // Validar sección actual antes de avanzar
    if (!isStepComplete(activeTab)) {
      setMensaje(
        "Por favor, complete todas las preguntas obligatorias (*) de esta sección."
      );
      window.scrollTo(0, 0);
      return;
    }

    if (plantilla && activeTab < plantilla.secciones.length - 1) {
      setActiveTab((prev) => prev + 1);
      setMensaje(null);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (activeTab > 0) {
      setActiveTab((prev) => prev - 1);
      setMensaje(null);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!token) {
      alert("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
      logout();
      return;
    }
    if (!instanciaId || !plantilla) return;

    // Validación Final Global
    const preguntasObligatorias = plantilla.secciones
      .flatMap((s) => s.preguntas)
      .filter((p) => p.tipo === "MULTIPLE_CHOICE");

    const primeraFaltante = preguntasObligatorias.find(
      (p) => !respuestas[p.id]
    );

    if (primeraFaltante) {
      const indexSeccion = plantilla.secciones.findIndex((s) =>
        s.preguntas.some((p) => p.id === primeraFaltante.id)
      );
      if (indexSeccion !== -1) setActiveTab(indexSeccion);

      setErrorPreguntaId(primeraFaltante.id);
      setMensaje("Faltan preguntas obligatorias (*).");
      window.scrollTo(0, 0);
      return;
    }

    if (
      !confirm(
        "¿Estás seguro de enviar el reporte? No podrás editarlo después."
      )
    )
      return;

    setCargandoEnvio(true);

    // Armar payload
    const allPreguntas = plantilla.secciones.flatMap(
      (seccion) => seccion.preguntas
    );
    const payloadRespuestas = Object.entries(respuestas)
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
          return { pregunta_id: parseInt(preguntaId), texto: String(valor) };
        }
      })
      .filter(Boolean);

    const payload = { respuestas: payloadRespuestas };

    try {
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
        setMensaje("¡Reporte enviado correctamente!");
      } else {
        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Error al enviar. Intente de nuevo."
        );
      }
    } catch (error) {
      console.error("Error de red o al enviar el reporte:", error);
      setMensaje(
        `Error al enviar el reporte: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setCargandoEnvio(false);
    }
  };

  // --- PDF Export ---
  const handleDescargarPDF = () => {
    if (!plantilla) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(
      plantilla.materia_nombre || "Informe de Actividad Curricular",
      14,
      22
    );
    doc.setFontSize(12);
    doc.text(
      `${plantilla.comision_nombre || ""} - Año ${plantilla.anio || ""}`,
      14,
      29
    );
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(plantilla.titulo || "", 14, 36);

    const bodyData: any[] = [];
    plantilla.secciones.forEach((seccion) => {
      bodyData.push([
        {
          content: seccion.nombre,
          colSpan: 2,
          styles: {
            fontStyle: "bold",
            fillColor: [240, 240, 240],
            textColor: [15, 23, 42],
          },
        },
      ]);
      seccion.preguntas.forEach((pregunta) => {
        let respuestaTexto = "No respondida";
        const respuesta = respuestas[pregunta.id];
        if (pregunta.tipo === "MULTIPLE_CHOICE") {
          const opcion = pregunta.opciones?.find((o) => o.id === respuesta);
          respuestaTexto = opcion?.texto ?? "No respondida";
        } else {
          respuestaTexto = respuesta ? String(respuesta) : "No respondida";
        }
        bodyData.push([pregunta.texto, respuestaTexto]);
      });
    });

    autoTable(doc, {
      startY: 45,
      head: [["Pregunta", "Respuesta"]],
      body: bodyData,
      theme: "grid",
      headStyles: { fillColor: [51, 65, 85] },
    });

    const nombreArchivo = (
      plantilla.materia_nombre ||
      plantilla.titulo ||
      "Reporte"
    ).replace(/\s+/g, "_");
    doc.save(`Reporte_${nombreArchivo}.pdf`);
  };

  // --- Renderizado ---

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">
        Cargando reporte...
      </div>
    );

  if (mensaje && mensaje.toLowerCase().includes("error") && !plantilla) {
    return (
      <p className="text-center mt-8 text-red-600 bg-red-100 p-4 rounded border border-red-300">
        {mensaje}
      </p>
    );
  }

  if (!plantilla)
    return (
      <p className="text-center mt-8 text-orange-600">
        No se encontró la información del reporte.
      </p>
    );

  if (reporteCompletado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center animate-fadeIn">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md border border-gray-200">
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
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDescargarPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition w-full"
            >
              Descargar PDF
            </button>
            <button
              onClick={() => navigate("/profesores")}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition w-full"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Datos para el header (state o API)
  const materiaMostrar =
    plantilla.materia_nombre || stateData?.materiaNombre || "Materia";
  const anioMostrar =
    plantilla.anio || stateData?.anio || new Date().getFullYear();

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md mt-6 mb-8 border border-gray-200">
      {/* --- Encabezado --- */}
      <div className="pb-4 mb-4 border-b border-gray-200 text-center">
        <h1 className="text-2xl font-bold text-indigo-800">{materiaMostrar}</h1>
        <p className="text-lg text-gray-700 mt-1">
          Ciclo Lectivo {anioMostrar}
        </p>
        <p className="text-sm text-gray-500 mt-2 uppercase tracking-wide">
          {plantilla.titulo}
        </p>
        {plantilla.descripcion && (
          <p className="text-sm text-gray-600 mt-1 italic max-w-2xl mx-auto">
            {plantilla.descripcion}
          </p>
        )}
      </div>

      {/* --- Barra de Progreso --- */}
      {plantilla.secciones.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
            <span>Progreso</span>
            <span>
              {Math.round((activeTab / plantilla.secciones.length) * 100)}%
            </span>
          </div>
          <BarraProgreso
            actual={activeTab}
            total={plantilla.secciones.length}
          />
        </div>
      )}

      {/* --- Pestañas / Pasos (Validación Aplicada) --- */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {plantilla.secciones.map((seccion, index) => {
          const isActive = activeTab === index;
          const isCompleted = index < activeTab;
          // Solo habilitamos si es la actual, anterior, o si las previas están listas
          const isNavigable = canNavigateToStep(index);

          return (
            <button
              key={seccion.id}
              type="button"
              disabled={!isNavigable}
              onClick={() => {
                if (isNavigable) {
                  setActiveTab(index);
                  setMensaje(null);
                }
              }}
              className={`
                py-3 px-5 font-medium text-sm whitespace-nowrap transition-colors duration-150 focus:outline-none border-b-2 flex items-center gap-2
                ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : isNavigable
                    ? "border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50"
                    : "border-transparent text-gray-300 cursor-not-allowed opacity-60" // Estilo deshabilitado
                }
              `}
            >
              {isCompleted && <span className="text-green-500 text-xs">✓</span>}
              {seccion.nombre.includes(":")
                ? seccion.nombre.split(":")[0]
                : `Paso ${index + 1}`}
            </button>
          );
        })}
      </div>

      {/* --- Formulario --- */}
      <div className="space-y-6 min-h-[300px]">
        {plantilla.secciones.map((seccion, index) => (
          <div
            key={seccion.id}
            className={
              activeTab === index ? "block space-y-6 animate-fadeIn" : "hidden"
            }
          >
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">
              {seccion.nombre}
            </h3>

            {seccion.preguntas.map((pregunta) => {
              const tipo = pregunta.tipo;
              const hasError = errorPreguntaId === pregunta.id;

              return (
                <div
                  key={pregunta.id}
                  className={`p-5 bg-gray-50 rounded-lg border ${
                    hasError
                      ? "border-red-400 ring-1 ring-red-200"
                      : "border-gray-200"
                  } transition-all`}
                >
                  <p className="font-medium mb-3 text-gray-800 text-base">
                    {pregunta.texto}
                    {tipo === "MULTIPLE_CHOICE" && (
                      <span className="text-red-500 ml-1" title="Obligatorio">
                        *
                      </span>
                    )}
                  </p>

                  {tipo === "REDACCION" ? (
                    <>
                      {pregunta.origen_datos === "resultados_encuesta" && (
                        <div className="mb-3">
                          <ResumenEncuesta
                            resultadosEncuesta={resultadosEncuesta}
                            onGenerarResumen={setResumenParaCopiar}
                          />
                          {resumenParaCopiar && (
                            <button
                              type="button"
                              onClick={() => handleCopyResumen(pregunta.id)}
                              className="mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                            >
                              Pegar resumen generado
                            </button>
                          )}
                        </div>
                      )}
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Escriba su respuesta..."
                        rows={5}
                        value={(respuestas[pregunta.id] as string) || ""}
                        onChange={(e) =>
                          handleChange(pregunta.id, e.target.value)
                        }
                      />
                    </>
                  ) : tipo === "MULTIPLE_CHOICE" ? (
                    <div className="space-y-2 mt-2">
                      {pregunta.opciones?.map((opcion) => (
                        <label
                          key={opcion.id}
                          className={`flex items-center space-x-3 cursor-pointer p-3 rounded-md border transition-colors ${
                            Number(respuestas[pregunta.id]) === opcion.id
                              ? "bg-indigo-50 border-indigo-200"
                              : "bg-white border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`pregunta-${pregunta.id}`}
                            value={opcion.id}
                            checked={
                              Number(respuestas[pregunta.id]) === opcion.id
                            }
                            onChange={() =>
                              handleChange(pregunta.id, opcion.id)
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <span className="text-gray-700">{opcion.texto}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* --- Mensajes de Estado --- */}
      {mensaje && (
        <div
          className={`mt-6 text-center font-medium p-3 rounded border ${
            mensaje.toLowerCase().includes("error") ||
            mensaje.includes("Faltan") ||
            mensaje.includes("complete")
              ? "text-red-700 bg-red-50 border-red-200"
              : "text-green-700 bg-green-50 border-green-200"
          }`}
        >
          {mensaje}
        </div>
      )}

      {/* --- Botonera de Navegación Inferior --- */}
      <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeTab === 0}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors border ${
            activeTab === 0
              ? "text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50"
              : "text-gray-700 border-gray-300 hover:bg-gray-100 bg-white"
          }`}
        >
          ← Anterior
        </button>

        {activeTab < (plantilla?.secciones.length || 0) - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5"
          >
            Siguiente Paso →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={cargandoEnvio}
            className={`px-8 py-2.5 rounded-lg font-bold text-white shadow-md transition-all ${
              cargandoEnvio
                ? "bg-green-400 cursor-wait"
                : "bg-green-600 hover:bg-green-700 transform hover:-translate-y-0.5"
            }`}
          >
            {cargandoEnvio ? "Enviando..." : "Finalizar y Enviar"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ResponderReportes;
