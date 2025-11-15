import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ResumenEncuesta from "../components/estadisticas/ResumenEncuesta";
import { useAuth } from "../auth/AuthContext";

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

  const [plantilla, setPlantilla] = useState<PlantillaReporte | null>(null);
  const [respuestas, setRespuestas] = useState<{
    [key: number]: string | number;
  }>({});
  const [resultadosEncuesta, setResultadosEncuesta] = useState<
    ResultadoSeccion[] | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [reporteCompletado, setReporteCompletado] = useState(false);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const [errorPreguntaId, setErrorPreguntaId] = useState<number | null>(null);

  const [resumenParaCopiar, setResumenParaCopiar] = useState<string>("");
  const { token, logout } = useAuth();
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
      setActiveTab(0);

      if (!instanciaId) {
        setMensaje("No se proporcionó ID de instancia");
        setLoading(false);
        return;
      }
      try {
        // --- CAMBIO 2: ELIMINAMOS la línea 'const token = localStorage.getItem("token");' ---
        const response = await fetch(
          `${API_BASE_URL}/encuestas-abiertas/reporte/instancia/${instanciaId}/detalles`,
          {
            headers: { Authorization: `Bearer ${token}` }, // <-- Ahora usa el token del hook
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
          }
          const errData = await response.json();
          if (response.status === 404) {
            setMensaje("El reporte no se encontró o ya no está activo.");
          } else {
            setMensaje(errData.detail || `Error ${response.status}`);
          }
          // Lanzamos el error para que sea capturado por el catch
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

  useEffect(() => {
    // Usamos el 'token' del hook
    if (!token) {
      console.error("No hay token, no se pueden cargar los resultados.");
      return;
    }
    const fetchResultados = async () => {
      try {
        // --- CAMBIO 3: ELIMINAMOS la línea 'const token = localStorage.getItem("token");' ---
        const res = await fetch(`${API_BASE_URL}/profesor/mis-resultados`, {
          headers: { Authorization: `Bearer ${token}` }, // <-- Ahora usa el token del hook
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

  const handleChange = (preguntaId: number, value: string | number) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: value,
    }));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
      logout();
      return;
    }

    if (!instanciaId || !plantilla) return;

    setErrorPreguntaId(null);
    setMensaje(null);

    const preguntasObligatorias = plantilla.secciones
      .flatMap((s) => s.preguntas)
      .filter((p) => p.tipo === "MULTIPLE_CHOICE");

    const primeraPreguntaSinRespuesta = preguntasObligatorias.find(
      (p) => !respuestas[p.id]
    );

    if (primeraPreguntaSinRespuesta) {
      let tabIndex = -1;
      for (let i = 0; i < plantilla.secciones.length; i++) {
        if (
          plantilla.secciones[i].preguntas.some(
            (p) => p.id === primeraPreguntaSinRespuesta.id
          )
        ) {
          tabIndex = i;
          break;
        }
      }

      if (tabIndex !== -1) {
        setActiveTab(tabIndex);
      }

      setErrorPreguntaId(primeraPreguntaSinRespuesta.id);
      setMensaje(
        "Por favor, responde todas las preguntas obligatorias (*). Hemos resaltado la primera que falta."
      );
      return;
    }

    setCargandoEnvio(true);

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
      // --- CAMBIO 4: ELIMINAMOS la línea 'const token = localStorage.getItem("token");' ---
      const response = await fetch(
        `${API_BASE_URL}/reportes-abiertas/instancia/${instanciaId}/responder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // <-- Ahora usa el token del hook
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
        throw new Error(
          errorData.detail || "Error al enviar. Intente de nuevo."
        );
      }

      setMensaje("¡Reporte enviado correctamente!");
      setReporteCompletado(true);
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
      didParseCell: (data) => {
        const rawRow = data.row.raw as any[];
        const firstCell = rawRow?.[0];

        if (
          firstCell &&
          typeof firstCell === "object" &&
          firstCell.colSpan === 2
        ) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [15, 23, 42];
        }

        if (
          data.column.index === 1 &&
          typeof data.cell.raw === "string" &&
          data.cell.raw.length > 70
        ) {
          data.cell.styles.halign = "left";
        }
      },
    });

    const nombreArchivo = (
      plantilla.materia_nombre ||
      plantilla.titulo ||
      "Reporte"
    ).replace(/\s+/g, "_");

    const anioArchivo = plantilla.anio || new Date().getFullYear();

    doc.save(`Reporte_${nombreArchivo}_${anioArchivo}.pdf`);
  };

  if (loading)
    return (
      <p className="text-center mt-8 animate-pulse text-gray-500">
        Cargando reporte...
      </p>
    );

  if (mensaje && mensaje.toLowerCase().includes("error") && !plantilla) {
    return (
      <p className="text-center mt-8 text-red-600 bg-red-100 p-4 rounded border border-red-300">
        Error: {mensaje}
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
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate("/profesores")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Ver reportes pendientes
            </button>
            <button
              onClick={handleDescargarPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Descargar PDF
            </button>
            <button
              onClick={() => navigate("/profesores")}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md mt-6 mb-8 border border-gray-200">
      <div className="pb-4 mb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-center text-indigo-800">
          {plantilla.materia_nombre || plantilla.titulo}
        </h1>

        {plantilla.comision_nombre && plantilla.anio && (
          <p className="text-lg text-gray-700 text-center mt-1">
            {plantilla.comision_nombre} - Año {plantilla.anio}
          </p>
        )}

        <p className="text-sm text-gray-500 text-center mt-2">
          {plantilla.titulo}
        </p>

        {plantilla.descripcion && (
          <p className="text-sm text-gray-600 text-center mt-1 italic">
            {plantilla.descripcion}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex border-b border-gray-300 mb-4 -mx-6 sm:-mx-8 px-6 sm:px-8 overflow-x-auto">
          {plantilla.secciones?.map((seccion, index) => (
            <button
              key={seccion.id}
              type="button"
              onClick={() => {
                setMensaje(null);
                setErrorPreguntaId(null);
                setActiveTab(index);
              }}
              className={`py-3 px-5 font-medium text-sm whitespace-nowrap ${
                activeTab === index
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              } transition-colors duration-150 focus:outline-none`}
            >
              {seccion.nombre}
            </button>
          ))}
        </div>

        <div>
          {plantilla.secciones?.map((seccion, index) => (
            <div
              key={seccion.id}
              className={activeTab === index ? "block space-y-5" : "hidden"}
            >
              {seccion.preguntas.map((pregunta) => {
                const tipo = pregunta.tipo;
                const esRedaccion = tipo === "REDACCION";
                const esMultipleChoice = tipo === "MULTIPLE_CHOICE";
                const hasError = errorPreguntaId === pregunta.id;

                return (
                  <div
                    key={pregunta.id}
                    className={`p-4 bg-gray-50 rounded-md border ${
                      hasError
                        ? "border-red-400 ring-2 ring-red-100"
                        : "border-gray-100"
                    } transition-all`}
                  >
                    <p className="font-medium mb-3 text-gray-800">
                      {pregunta.texto}

                      {esMultipleChoice && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </p>

                    {esRedaccion ? (
                      <>
                        {pregunta.origen_datos === "resultados_encuesta" && (
                          <ResumenEncuesta
                            resultadosEncuesta={resultadosEncuesta}
                            onGenerarResumen={setResumenParaCopiar}
                          />
                        )}

                        <textarea
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                          placeholder="Escribe tu respuesta..."
                          rows={6}
                          value={(respuestas[pregunta.id] as string) || ""}
                          onChange={(e) =>
                            handleChange(pregunta.id, e.target.value)
                          }
                        />

                        {pregunta.origen_datos === "resultados_encuesta" &&
                          resumenParaCopiar && (
                            <div className="flex justify-end mt-2">
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
                    ) : esMultipleChoice ? (
                      <div className="space-y-2">
                        {pregunta.opciones?.map((opcion) => (
                          <label
                            key={opcion.id}
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-indigo-50 transition-colors"
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
                            <span className="text-gray-700">
                              {opcion.texto}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-500 text-sm italic">
                        Tipo de pregunta no soportado: {pregunta.tipo}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {mensaje && (
          <p
            className={`text-center font-medium p-3 rounded border ${
              mensaje.toLowerCase().includes("error") ||
              errorPreguntaId !== null
                ? "text-red-700 bg-red-100 border-red-300"
                : "text-green-700 bg-green-100 border-green-300"
            }`}
          >
            {mensaje}
          </p>
        )}

        <div className="text-center pt-4">
          <button
            type="submit"
            disabled={cargandoEnvio}
            className={`bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cargandoEnvio ? "Enviando Reporte..." : "Finalizar y Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResponderReportes;
