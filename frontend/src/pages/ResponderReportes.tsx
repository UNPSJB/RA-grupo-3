import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ResumenEncuesta from "../components/estadisticas/ResumenEncuesta";
import { useAuth } from "../auth/AuthContext";
import BarraProgreso from "../components/estadisticas/BarraProgreso";

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
  anio: number;
  sede: string;
  codigo: string;
  docente_responsable: string;
  cantidad_inscriptos?: number;
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
  const { token, logout } = useAuth();

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

  // Generar opciones de porcentaje (0% a 100% en pasos de 5 o 10)
  const porcentajeOptions = useMemo(() => {
    const opts = [];
    for (let i = 0; i <= 100; i += 5) {
      opts.push(`${i}%`);
    }
    return opts;
  }, []);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const fetchReporte = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/encuestas-abiertas/reporte/instancia/${instanciaId}/detalles`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
            return;
          }
          const errData = await response.json();
          throw new Error(errData.detail || `Error ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) setPlantilla(data);
      } catch (error) {
        if (isMounted) setMensaje("Error al cargar el reporte.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchReporte();
    return () => {
      isMounted = false;
    };
  }, [instanciaId, token, logout]);

  useEffect(() => {
    if (!token) return;
    const fetchResultados = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profesor/mis-resultados`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const first = Array.isArray(json) && json.length > 0 ? json[0] : null;
          setResultadosEncuesta(first ? first.resultados_por_seccion : []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchResultados();
  }, [token]);

  useEffect(() => {
    if (plantilla && plantilla.cantidad_inscriptos !== undefined) {
      const allPreguntas = plantilla.secciones.flatMap((s) => s.preguntas);
      const preguntaAlumnos = allPreguntas.find((p) =>
        p.texto.toLowerCase().includes("cantidad de alumnos inscriptos")
      );
      if (preguntaAlumnos) {
        setRespuestas((prev) => ({
          ...prev,
          [preguntaAlumnos.id]: plantilla.cantidad_inscriptos!.toString(),
        }));
      }
    }
  }, [plantilla]);

  const isPreguntaObligatoria = (p: Pregunta) => {
    if (p.tipo === "MULTIPLE_CHOICE") return true;
    if (p.tipo === "REDACCION") {
      const txt = p.texto.toUpperCase().trim();
      if (
        txt.startsWith("CANTIDAD") ||
        txt.startsWith("2.") ||
        txt.startsWith("2.A") ||
        txt.startsWith("2.B") ||
        txt.startsWith("2.C") ||
        txt.startsWith("3.") ||
        txt.startsWith("4.")
      )
        return true;
    }
    return false;
  };

  const isSeccionActualValida = useMemo(() => {
    if (!plantilla) return false;
    const seccion = plantilla.secciones[activeTab];
    if (!seccion) return false;
    const obligatorias = seccion.preguntas.filter(isPreguntaObligatoria);

    return obligatorias.every((p) => {
      const val = respuestas[p.id];
      if (val === undefined || val === null) return false;
      const valStr = String(val);

      // Lógica Híbrida (Pregunta 4 y Porcentajes)
      if (valStr.includes(" ||| ")) {
        const [calif] = valStr.split(" ||| ");
        return calif.trim() !== "";
      }
      return valStr.trim() !== "";
    });
  }, [plantilla, activeTab, respuestas]);

  const handleChange = (preguntaId: number, value: string | number) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: value }));
    if (errorPreguntaId === preguntaId) {
      setErrorPreguntaId(null);
      setMensaje(null);
    }
  };

  // Handler genérico para cualquier pregunta híbrida (Dropdown + Texto)
  const handleCombinedChange = (
    preguntaId: number,
    tipo: "calificacion" | "justificacion",
    valor: string
  ) => {
    setRespuestas((prev) => {
      const valorActual = String(prev[preguntaId] || "");
      const parts = valorActual.includes(" ||| ")
        ? valorActual.split(" ||| ")
        : ["", ""];
      let [calificacion, justificacion] = parts;

      if (tipo === "calificacion") calificacion = valor;
      if (tipo === "justificacion") justificacion = valor;

      return { ...prev, [preguntaId]: `${calificacion} ||| ${justificacion}` };
    });
  };

  const getCombinedValues = (preguntaId: number) => {
    const val = String(respuestas[preguntaId] || "");
    if (val.includes(" ||| ")) {
      const parts = val.split(" ||| ");
      return { calificacion: parts[0], justificacion: parts[1] };
    }
    return { calificacion: "", justificacion: val };
  };

  const handleCopyResumen = (preguntaId: number) => {
    if (resumenParaCopiar) handleChange(preguntaId, resumenParaCopiar);
  };

  const handleNext = () => {
    if (plantilla && activeTab < plantilla.secciones.length - 1) {
      setActiveTab((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (activeTab > 0) {
      setActiveTab((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !instanciaId || !plantilla) return;
    if (!confirm("¿Estás seguro de enviar el reporte?")) return;
    setCargandoEnvio(true);
    const allPreguntas = plantilla.secciones.flatMap((s) => s.preguntas);
    const payloadRespuestas = Object.entries(respuestas)
      .map(([pid, val]) => {
        const preguntaId = Number(pid);
        const pregunta = allPreguntas.find((p) => p.id === preguntaId);
        if (!pregunta) return null;
        if (pregunta.tipo === "MULTIPLE_CHOICE")
          return { pregunta_id: preguntaId, opcion_id: Number(val) };
        return { pregunta_id: preguntaId, texto: String(val) };
      })
      .filter(Boolean);

    try {
      const response = await fetch(
        `${API_BASE_URL}/reportes-abiertas/instancia/${instanciaId}/responder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ respuestas: payloadRespuestas }),
        }
      );
      if (response.ok) setReporteCompletado(true);
      else throw new Error("Error al enviar.");
    } catch (error) {
      setMensaje("Error al enviar el reporte.");
    } finally {
      setCargandoEnvio(false);
    }
  };

  const handleDescargarPDF = () => {
    if (!plantilla) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(plantilla.materia_nombre, 14, 20);
    doc.setFontSize(10);
    autoTable(doc, {
      startY: 25,
      head: [["Dato", "Valor"]],
      body: [
        ["Sede", plantilla.sede],
        ["Ciclo Lectivo", String(plantilla.anio)],
        ["Código", plantilla.codigo],
        ["Docente", plantilla.docente_responsable],
      ],
      theme: "striped",
      headStyles: { fillColor: [66, 66, 66] },
    });
    const bodyData: any[] = [];
    plantilla.secciones.forEach((seccion) => {
      bodyData.push([
        {
          content: seccion.nombre,
          colSpan: 2,
          styles: { fillColor: [220, 220, 220], fontStyle: "bold" },
        },
      ]);
      seccion.preguntas.forEach((pregunta) => {
        let respuestaTexto = "No respondida";
        const val = respuestas[pregunta.id];
        if (typeof val === "string" && val.includes(" ||| ")) {
          const [calif, just] = val.split(" ||| ");
          respuestaTexto = `Valor: ${calif}\nJustif: ${just}`;
        } else if (pregunta.tipo === "MULTIPLE_CHOICE") {
          const opcion = pregunta.opciones?.find((o) => o.id === val);
          respuestaTexto = opcion?.texto ?? "-";
        } else {
          respuestaTexto = val ? String(val) : "-";
        }
        bodyData.push([pregunta.texto, respuestaTexto]);
      });
    });
    autoTable(doc, { head: [["Pregunta", "Respuesta"]], body: bodyData });
    doc.save(`Reporte_${plantilla.materia_nombre}.pdf`);
  };

  if (loading)
    return <div className="p-10 text-center animate-pulse">Cargando...</div>;
  if (reporteCompletado)
    return (
      <div className="text-center p-10 bg-white rounded shadow max-w-lg mx-auto mt-10">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ¡Reporte Enviado!
        </h2>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleDescargarPDF}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Descargar PDF
          </button>
          <button
            onClick={() => navigate("/profesores")}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Volver
          </button>
        </div>
      </div>
    );
  if (!plantilla)
    return (
      <div className="text-center p-10 text-red-500">
        Error cargando plantilla.
      </div>
    );

  const totalSecciones = plantilla.secciones.length;
  const porcentajeProgreso =
    totalSecciones > 0 ? Math.round((activeTab / totalSecciones) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md mt-6 mb-8 border border-gray-200">
      <div className="pb-4 mb-4 border-b border-gray-200 text-center">
        <h1 className="text-2xl font-bold text-indigo-800">
          {plantilla.materia_nombre}
        </h1>
        <p className="text-sm text-gray-500 mt-2">{plantilla.titulo}</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
          <span>Progreso del Informe</span>
          <span>{porcentajeProgreso}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${porcentajeProgreso}%` }}
          ></div>
        </div>
        <div className="text-right text-xs text-gray-500 mt-1">
          Sección {activeTab + 1} de {totalSecciones}
        </div>
      </div>

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

            {index === 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-bold text-blue-800 uppercase mb-3 tracking-wide border-b border-blue-200 pb-1">
                  Datos de la Cursada
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-600 block">
                      Sede:
                    </span>{" "}
                    {plantilla.sede}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 block">
                      Ciclo Lectivo:
                    </span>{" "}
                    {plantilla.anio}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 block">
                      Actividad Curricular:
                    </span>{" "}
                    {plantilla.materia_nombre}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 block">
                      Código:
                    </span>{" "}
                    {plantilla.codigo}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-gray-600 block">
                      Docente Responsable:
                    </span>{" "}
                    {plantilla.docente_responsable}
                  </div>
                </div>
              </div>
            )}

            {seccion.preguntas.map((pregunta) => {
              const esPregunta4 = pregunta.texto.startsWith("4.");
              const esPreguntaPorcentaje =
                pregunta.origen_datos === "dropdown_porcentaje_justificacion";
              const esPreguntaCorta = pregunta.texto.startsWith("Cantidad");
              const obligatorio = isPreguntaObligatoria(pregunta);

              // Determinar opciones para el dropdown según el tipo
              const opcionesDropdown = esPregunta4
                ? [
                    "Excelente (E)",
                    "Muy Bueno (MB)",
                    "Bueno (B)",
                    "Regular (R)",
                    "Insuficiente (I)",
                    "No corresponde",
                  ]
                : porcentajeOptions;

              const placeholderDropdown = esPregunta4
                ? "Seleccionar Calificación..."
                : "Seleccionar Porcentaje...";
              const placeholderTextarea = esPregunta4
                ? "Justifique la calificación..."
                : "Justifique (si es necesario)...";
              const labelDropdown = esPregunta4
                ? "Calificación"
                : "Porcentaje Alcanzado";

              return (
                <div
                  key={pregunta.id}
                  className="p-5 bg-gray-50 rounded-lg border border-gray-200 transition-all hover:border-indigo-200"
                >
                  <p className="font-medium mb-3 text-gray-800 text-base">
                    {pregunta.texto}{" "}
                    {obligatorio && <span className="text-red-500">*</span>}
                  </p>

                  {/* CASO HÍBRIDO (PREGUNTA 4 O PORCENTAJES) */}
                  {esPregunta4 || esPreguntaPorcentaje ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            {labelDropdown}
                          </label>
                          <select
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={getCombinedValues(pregunta.id).calificacion}
                            onChange={(e) =>
                              handleCombinedChange(
                                pregunta.id,
                                "calificacion",
                                e.target.value
                              )
                            }
                          >
                            <option value="">{placeholderDropdown}</option>
                            {opcionesDropdown.map((op) => (
                              <option key={op} value={op}>
                                {op}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Justificación
                          </label>
                          <textarea
                            rows={2}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            placeholder={placeholderTextarea}
                            value={getCombinedValues(pregunta.id).justificacion}
                            onChange={(e) =>
                              handleCombinedChange(
                                pregunta.id,
                                "justificacion",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {pregunta.tipo === "REDACCION" && (
                        <>
                          {pregunta.origen_datos === "resultados_encuesta" && (
                            <div className="mb-2">
                              <ResumenEncuesta
                                resultadosEncuesta={resultadosEncuesta}
                                onGenerarResumen={setResumenParaCopiar}
                              />
                              {resumenParaCopiar && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyResumen(pregunta.id)}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                >
                                  Pegar Resumen
                                </button>
                              )}
                            </div>
                          )}
                          {esPreguntaCorta ? (
                            <input
                              type="text"
                              disabled={pregunta.texto
                                .toLowerCase()
                                .includes("alumnos inscriptos")}
                              className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 ${
                                pregunta.texto
                                  .toLowerCase()
                                  .includes("alumnos inscriptos")
                                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                                  : ""
                              }`}
                              placeholder="Ingrese cantidad..."
                              value={String(respuestas[pregunta.id] || "")}
                              onChange={(e) =>
                                handleChange(pregunta.id, e.target.value)
                              }
                            />
                          ) : (
                            <textarea
                              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                              rows={4}
                              value={String(respuestas[pregunta.id] || "")}
                              onChange={(e) =>
                                handleChange(pregunta.id, e.target.value)
                              }
                            />
                          )}
                        </>
                      )}
                      {pregunta.tipo === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2">
                          {pregunta.opciones?.map((op) => (
                            <label
                              key={op.id}
                              className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded"
                            >
                              <input
                                type="radio"
                                name={`p-${pregunta.id}`}
                                checked={
                                  Number(respuestas[pregunta.id]) === op.id
                                }
                                onChange={() =>
                                  handleChange(pregunta.id, op.id)
                                }
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{op.texto}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
        <button
          onClick={handlePrev}
          disabled={activeTab === 0}
          className={`px-6 py-2.5 rounded-lg font-medium border ${
            activeTab === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Anterior
        </button>
        {activeTab < (plantilla?.secciones.length || 0) - 1 ? (
          <button
            onClick={handleNext}
            disabled={!isSeccionActualValida}
            className={`px-6 py-2.5 rounded-lg font-semibold text-white shadow-md transition-all ${
              !isSeccionActualValida
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={(e) => handleSubmit(e)}
            disabled={cargandoEnvio || !isSeccionActualValida}
            className={`px-8 py-2.5 rounded-lg font-bold text-white shadow-md transition-all ${
              cargandoEnvio || !isSeccionActualValida
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {cargandoEnvio ? "Enviando..." : "Finalizar"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ResponderReportes;
