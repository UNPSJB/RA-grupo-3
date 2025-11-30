import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- Interfaces ---
interface RespuestaSimple {
  pregunta_id: number;
  pregunta_texto?: string;
  texto?: string;
  opcion_texto?: string;
}

interface InformeAsignatura {
  id: number;
  materia_nombre: string;
  docente_nombre: string;
  respuestas: RespuestaSimple[];
}

interface InformeSinteticoCompleto {
  id: number;
  titulo: string;
  descripcion: string;
  sede?: string;
  anio?: number;
  departamento?: string;
  informes_asignaturas: InformeAsignatura[];
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE";
}

interface Seccion {
  id: number;
  nombre: string;
  preguntas: Pregunta[];
}

interface PlantillaInforme {
  id: number;
  titulo: string;
  descripcion: string;
  secciones: Seccion[];
}

const ResponderInforme: React.FC = () => {
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  // Estados
  const [datosInsumos, setDatosInsumos] =
    useState<InformeSinteticoCompleto | null>(null);
  const [plantilla, setPlantilla] = useState<PlantillaInforme | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [respuestasUsuario, setRespuestasUsuario] = useState<{
    [key: string]: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // 1. CARGA DE DATOS
  useEffect(() => {
    if (!token || !instanciaId) return;

    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [resInsumos, resPlantilla] = await Promise.all([
          fetch(
            `${API_BASE_URL}/departamento/informes-sinteticos/${instanciaId}/detalle-completo`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          fetch(
            `${API_BASE_URL}/departamento/instancia/${instanciaId}/detalles`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);

        if (resInsumos.ok) setDatosInsumos(await resInsumos.json());
        if (resPlantilla.ok) setPlantilla(await resPlantilla.json());
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [instanciaId, token]);

  // 2. LOGICA DE FILTRADO ESTRICTO (SOLUCIÓN A TU PROBLEMA)
  const esSeccionOculta = (nombreSeccion: string) => {
    const s = nombreSeccion.toLowerCase();
    // Ocultamos secciones 1, 2, 3, 4 (Técnicas)
    // Mostramos solo si parece ser la Sección 5 o de Cierre
    return !(
      s.includes("5") ||
      s.includes("sintesis") ||
      s.includes("síntesis") ||
      s.includes("conclusiones") ||
      s.includes("generales")
    );
  };

  const esPreguntaVisible = (
    seccionNombre: string,
    textoPregunta: string
  ): boolean => {
    const t = textoPregunta.toLowerCase();

    // CASO 1: Campo "Integrantes" -> SIEMPRE VISIBLE (no importa la sección)
    if (t.includes("integrantes")) return true;

    // CASO 2: Si la sección es oculta (1-4), la pregunta NO se ve (salvo integrantes)
    if (esSeccionOculta(seccionNombre)) return false;

    // CASO 3: Si es la Sección 5, mostramos todo (allí vive la Síntesis)
    return true;
  };

  // Etiqueta bonita para la UI
  const getLabelAmigable = (textoOriginal: string) => {
    if (textoOriginal.toLowerCase().includes("integrantes"))
      return "Integrantes de la Comisión Asesora";
    return textoOriginal; // El resto queda igual (ej: "Síntesis de los informes...")
  };

  // 3. GUARDADO INTELIGENTE (Igual que antes, procesa lo oculto)
  const handleFinalizar = async () => {
    if (!plantilla || !datosInsumos) return;
    if (!window.confirm("¿Confirmar y generar informe?")) return;

    setEnviando(true);

    try {
      const payloadRespuestas: { pregunta_id: number; texto: string }[] = [];

      plantilla.secciones.forEach((seccion) => {
        seccion.preguntas.forEach((preguntaDestino) => {
          // A. Manual (Lo que escribiste en los 2 campos visibles)
          if (respuestasUsuario[preguntaDestino.id]) {
            payloadRespuestas.push({
              pregunta_id: preguntaDestino.id,
              texto: respuestasUsuario[preguntaDestino.id],
            });
            return;
          }

          // B. Automático (Todo lo oculto: Sede, Ciclo, Secciones 1-4)
          let contenidoAutomatico = "";
          const titulo = preguntaDestino.texto.trim().toLowerCase();

          if (titulo.includes("sede"))
            contenidoAutomatico = datosInsumos.sede || "";
          else if (titulo.includes("ciclo") || titulo.includes("año"))
            contenidoAutomatico = String(datosInsumos.anio || "");
          else if (
            titulo.includes("comision") &&
            !titulo.includes("integrantes")
          )
            contenidoAutomatico = datosInsumos.departamento || "";
          // Contenido Técnico Oculto (Secciones 1-4)
          else if (!esPreguntaVisible(seccion.nombre, preguntaDestino.texto)) {
            const recopilacion: string[] = [];
            datosInsumos.informes_asignaturas.forEach((informe) => {
              // Match por nombre de pregunta
              let match = informe.respuestas.find(
                (r) => r.pregunta_texto?.trim().toLowerCase() === titulo
              );

              if (match) {
                const valor = match.texto || match.opcion_texto;
                if (
                  valor &&
                  valor !== "Sin respuesta registrada." &&
                  !valor.includes("simulada")
                ) {
                  recopilacion.push(`• ${informe.materia_nombre}: ${valor}`);
                }
              }
            });
            if (recopilacion.length > 0)
              contenidoAutomatico = recopilacion.join("\n");
          }

          if (contenidoAutomatico) {
            payloadRespuestas.push({
              pregunta_id: preguntaDestino.id,
              texto: contenidoAutomatico,
            });
          }
        });
      });

      const res = await fetch(
        `${API_BASE_URL}/departamento/instancia/${instanciaId}/responder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ respuestas: payloadRespuestas }),
        }
      );

      if (res.ok) {
        alert("Informe guardado correctamente.");
        navigate("/departamento/informes-sinteticos");
      } else {
        alert("Error al guardar.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse">Cargando datos...</div>
    );

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-8 bg-gray-100 min-h-screen font-sans">
      {/* HEADER: Celeste Suave */}
      <div className="bg-sky-50 border border-sky-100 text-slate-800 rounded-xl shadow-sm p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-200 rounded-full opacity-30 -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 text-sky-900">
            {datosInsumos?.titulo}
          </h1>
          <p className="text-slate-600 text-lg mb-6">
            {datosInsumos?.descripcion}
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="bg-white/80 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-sky-100 text-sky-900 shadow-sm">
              📅 Ciclo: <span className="font-bold">{datosInsumos?.anio}</span>
            </span>
            <span className="bg-white/80 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-sky-100 text-sky-900 shadow-sm">
              📍 Sede: <span className="font-bold">{datosInsumos?.sede}</span>
            </span>
            <span className="bg-white/80 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-sky-100 text-sky-900 shadow-sm">
              🏢 Depto:{" "}
              <span className="font-bold">{datosInsumos?.departamento}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- COLUMNA IZQUIERDA: INSUMOS --- */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-[750px]">
            <div className="bg-sky-700 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Respuestas de Cátedras
              </h2>
            </div>

            <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 shrink-0">
              {datosInsumos?.informes_asignaturas.map((asignatura, index) => (
                <button
                  key={asignatura.id}
                  onClick={() => setActiveTab(index)}
                  className={`px-6 py-4 whitespace-nowrap text-sm font-bold transition-all border-b-4 focus:outline-none ${
                    activeTab === index
                      ? "border-sky-600 text-sky-700 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {asignatura.materia_nombre}
                </button>
              ))}
            </div>

            <div className="p-8 bg-gray-50/50 overflow-y-auto flex-grow custom-scrollbar">
              {datosInsumos?.informes_asignaturas[activeTab] ? (
                <div className="animate-fadeIn space-y-8">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                        Materia
                      </p>
                      <h3 className="text-xl font-bold text-gray-800">
                        {
                          datosInsumos.informes_asignaturas[activeTab]
                            .materia_nombre
                        }
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                        Docente
                      </p>
                      <p className="text-sky-600 font-medium">
                        {
                          datosInsumos.informes_asignaturas[activeTab]
                            .docente_nombre
                        }
                      </p>
                    </div>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="space-y-6">
                    {datosInsumos.informes_asignaturas[
                      activeTab
                    ].respuestas.map((resp, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow"
                      >
                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-sky-400 rounded-r-md"></div>
                        <div className="pl-4">
                          <h4 className="font-bold text-slate-700 text-sm mb-3 group-hover:text-sky-700 transition-colors">
                            {resp.pregunta_texto}
                          </h4>
                          <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <span className="whitespace-pre-wrap">
                              {resp.texto || resp.opcion_texto || (
                                <em className="text-gray-400">
                                  Sin respuesta registrada.
                                </em>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 italic">
                  Seleccione una materia arriba.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: FORMULARIO --- */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl shadow-lg border border-sky-100 sticky top-6 flex flex-col h-[750px]">
            <div className="bg-sky-600 text-white px-6 py-4 font-semibold text-lg flex items-center gap-2 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Redacción Final
            </div>

            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              <div className="bg-sky-50 text-sky-900 text-sm p-4 rounded-lg border border-sky-100 flex gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-sky-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>
                  Complete los <strong>Integrantes</strong> y la{" "}
                  <strong>Síntesis Final</strong>. Las secciones técnicas (1 a
                  4) se completarán automáticamente al guardar.
                </p>
              </div>

              {plantilla?.secciones.map((seccion) => {
                // AQUÍ APLICAMOS EL FILTRO: Solo preguntas de Sección 5 o Integrantes
                const preguntasVisibles = seccion.preguntas.filter((p) =>
                  esPreguntaVisible(seccion.nombre, p.texto)
                );

                if (preguntasVisibles.length === 0) return null;

                return (
                  <div key={seccion.id} className="animate-fadeIn">
                    <div className="space-y-6">
                      {preguntasVisibles.map((pregunta) => {
                        const esIntegrantes = pregunta.texto
                          .toLowerCase()
                          .includes("integrantes");
                        return (
                          <div key={pregunta.id}>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                              {getLabelAmigable(pregunta.texto)}{" "}
                              {esIntegrantes && (
                                <span
                                  className="text-red-500 text-lg ml-1"
                                  title="Obligatorio"
                                >
                                  *
                                </span>
                              )}
                            </label>
                            <textarea
                              className={`w-full border border-gray-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-sm bg-white resize-y ${
                                esIntegrantes
                                  ? "min-h-[100px]"
                                  : "min-h-[250px]"
                              }`}
                              placeholder={
                                esIntegrantes
                                  ? "Liste los integrantes de la comisión..."
                                  : "Escriba sus conclusiones generales..."
                              }
                              value={respuestasUsuario[pregunta.id] || ""}
                              onChange={(e) =>
                                setRespuestasUsuario({
                                  ...respuestasUsuario,
                                  [pregunta.id]: e.target.value,
                                })
                              }
                            />
                            {esIntegrantes && (
                              <p className="text-xs text-gray-400 mt-1">
                                Campo obligatorio
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                onClick={handleFinalizar}
                disabled={enviando}
                className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 transform active:scale-95 ${
                  enviando
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 hover:shadow-green-500/30"
                }`}
              >
                {enviando ? (
                  "Procesando..."
                ) : (
                  <>
                    <span>Guardar y Cerrar Informe</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderInforme;
