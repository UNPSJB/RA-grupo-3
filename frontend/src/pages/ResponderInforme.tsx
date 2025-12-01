import React, { useState, useEffect, useMemo } from "react";
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

// --- MAPA DE PALABRAS CLAVE ---
// Claves en minúsculas y SIN punto final para facilitar el match
const KEYWORDS_POR_PREFIJO: Record<string, string[]> = {
  "0": ["alumnos", "inscriptos", "comisiones", "teóricas", "prácticas"],
  "1": ["equipamiento", "bibliografía", "insumos"],
  "2": ["horas", "dictadas"],
  "2.a": ["contenidos", "planificados", "estrategias"],
  "2.b": ["encuesta", "juicio", "valor"],
  "2.c": ["aspectos", "positivos", "obstáculos"],
  "3": ["actividades", "investigación", "extensión", "capacitación"],
  "4": ["auxiliares", "desempeño", "justificación"],
  "5": ["observaciones", "comentarios"],
};

// --- MODAL SIMPLE ---
const ModalConfirmacion: React.FC<{
  isOpen: boolean;
  type: "success" | "confirm";
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}> = ({ isOpen, type, title, message, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center transform transition-all scale-100 border border-gray-100">
        <div
          className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
            type === "success" ? "bg-green-100" : "bg-blue-100"
          }`}
        >
          {type === "success" ? (
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-center gap-3">
          {type === "confirm" ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-transform active:scale-95"
              >
                Confirmar
              </button>
            </>
          ) : (
            <button
              onClick={onConfirm || onClose}
              className="w-full py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 shadow-sm"
            >
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ResponderInforme: React.FC = () => {
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [datosInsumos, setDatosInsumos] =
    useState<InformeSinteticoCompleto | null>(null);
  const [plantilla, setPlantilla] = useState<PlantillaInforme | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [respuestasUsuario, setRespuestasUsuario] = useState<{
    [key: string]: string;
  }>({});

  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    type: "success" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ open: false, type: "success", title: "", message: "" });

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
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [instanciaId, token]);

  const normalizar = (str: string | undefined) =>
    str
      ? str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "")
      : "";

  const encontrarCoincidenciaInteligente = (
    tituloDestino: string,
    respuestasOrigen: RespuestaSimple[],
    materia: string
  ) => {
    const tDest = normalizar(tituloDestino);
    const matchExacto = respuestasOrigen.find((r) => {
      const tOrig = normalizar(r.pregunta_texto);
      return (
        tOrig === tDest ||
        (tOrig.length > 10 && tDest.includes(tOrig)) ||
        (tDest.length > 10 && tOrig.includes(tDest))
      );
    });
    if (matchExacto) return matchExacto;

    const palabrasClave = [
      "equipamiento",
      "bibliografia",
      "teoricas",
      "practicas",
      "contenidos",
      "valores",
      "aspectos",
      "capacitacion",
      "investigacion",
      "extension",
      "desempeno",
      "auxiliares",
    ];
    for (const palabra of palabrasClave) {
      if (tDest.includes(palabra)) {
        const matchKeyword = respuestasOrigen.find((r) =>
          normalizar(r.pregunta_texto).includes(palabra)
        );
        if (matchKeyword) return matchKeyword;
      }
    }
    return null;
  };

  const preguntasClave = useMemo(() => {
    if (!plantilla || !plantilla.secciones)
      return { integrantes: null, sintesis: null };

    const todas = plantilla.secciones.flatMap((s) => s.preguntas || []);
    const integrantes = todas.find((p) => {
      if (!p || !p.texto) return false;
      const t = normalizar(p.texto);
      return t.includes("integrante") && t.includes("comision");
    });
    const sintesis = todas.find((p) => {
      if (!p || !p.texto) return false;
      const t = normalizar(p.texto);
      return (
        (t.includes("sintesis") ||
          t.includes("observacion") ||
          t.includes("conclusion") ||
          t.includes("comentario")) &&
        p.id !== integrantes?.id
      );
    });
    return { integrantes, sintesis };
  }, [plantilla]);

  useEffect(() => {
    if (!plantilla || !datosInsumos) return;
    if (Object.keys(respuestasUsuario).length > 0) return;
    const nuevosValores: { [key: string]: string } = {};
    plantilla.secciones.forEach((seccion) => {
      seccion.preguntas?.forEach((p) => {
        if (
          p.id === preguntasClave.integrantes?.id ||
          p.id === preguntasClave.sintesis?.id
        )
          return;
        const txt = normalizar(p.texto);
        if (txt.includes("sede"))
          nuevosValores[p.id] = datosInsumos.sede || "Sede Central";
        else if (txt.includes("ciclo") || txt.includes("anio"))
          nuevosValores[p.id] = String(
            datosInsumos.anio || new Date().getFullYear()
          );
        else if (txt.includes("comision") && txt.includes("asesora"))
          nuevosValores[p.id] = datosInsumos.departamento || "";
      });
    });
    if (Object.keys(nuevosValores).length > 0)
      setRespuestasUsuario((prev) => ({ ...prev, ...nuevosValores }));
  }, [plantilla, datosInsumos, preguntasClave]);

  const iniciarGuardado = () => {
    if (preguntasClave.integrantes) {
      const valor = respuestasUsuario[preguntasClave.integrantes.id];
      if (!valor || valor.trim().length === 0) {
        setErrorValidacion(true);
        const el = document.getElementById("campo-integrantes");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    setErrorValidacion(false);
    setModal({
      open: true,
      type: "confirm",
      title: "Generar Informe",
      message:
        "Se recopilarán las respuestas de las cátedras y se guardará el informe. ¿Continuar?",
      onConfirm: procesarEnvio,
    });
  };

  const procesarEnvio = async () => {
    setModal({ ...modal, open: false });
    if (!plantilla || !datosInsumos) return;
    setEnviando(true);

    try {
      const payloadRespuestas: { pregunta_id: number; texto: string }[] = [];

      plantilla.secciones.forEach((seccion) => {
        // Obtenemos el prefijo de la SECCIÓN (para 0, 1, 3, 4, 5)
        let prefijoSeccion = seccion.nombre.split(" ")[0].trim().toLowerCase();
        if (prefijoSeccion.endsWith("."))
          prefijoSeccion = prefijoSeccion.slice(0, -1);

        seccion.preguntas.forEach((preguntaDestino) => {
          // 1. Manual o Metadata
          if (respuestasUsuario[preguntaDestino.id]) {
            payloadRespuestas.push({
              pregunta_id: preguntaDestino.id,
              texto: respuestasUsuario[preguntaDestino.id],
            });
            return;
          }
          const tituloNorm = normalizar(preguntaDestino.texto);
          if (tituloNorm.includes("sede")) {
            payloadRespuestas.push({
              pregunta_id: preguntaDestino.id,
              texto: datosInsumos.sede || "",
            });
            return;
          }
          if (tituloNorm.includes("ciclo") || tituloNorm.includes("anio")) {
            payloadRespuestas.push({
              pregunta_id: preguntaDestino.id,
              texto: String(datosInsumos.anio || ""),
            });
            return;
          }
          if (
            tituloNorm.includes("comision") &&
            tituloNorm.includes("asesora")
          ) {
            payloadRespuestas.push({
              pregunta_id: preguntaDestino.id,
              texto: datosInsumos.departamento || "",
            });
            return;
          }

          // 2. Lógica Automática
          if (
            preguntaDestino.id !== preguntasClave.integrantes?.id &&
            preguntaDestino.id !== preguntasClave.sintesis?.id
          ) {
            // --- CORRECCIÓN CLAVE: Obtener prefijo de la PREGUNTA para 2.A, 2.B, 2.C ---
            // Si la sección es la 2, miramos el inicio de la pregunta.
            // Ej: "2.A. Completar..." -> prefijo "2.a"
            let prefijoBusqueda = prefijoSeccion;
            if (prefijoSeccion === "2") {
              const partesPregunta = preguntaDestino.texto.split(" ");
              const inicio = partesPregunta[0].trim().toLowerCase(); // "2.", "2.a.", "2.b."
              // Limpiamos el punto final para usar en el mapa
              prefijoBusqueda = inicio.replace(/\.$/, "");
            }

            const keywords = KEYWORDS_POR_PREFIJO[prefijoBusqueda] || [];
            const recopilacion: string[] = [];

            datosInsumos.informes_asignaturas.forEach((inf) => {
              const respuestasRelevantes = inf.respuestas.filter((r) => {
                const textoPregProf = normalizar(r.pregunta_texto);

                // Casos especiales Sección 0 y 2 (Hora pura)
                if (prefijoBusqueda === "0")
                  return (
                    textoPregProf.includes("alumno") ||
                    textoPregProf.includes("comision")
                  );
                if (prefijoBusqueda === "2")
                  return (
                    textoPregProf.includes("horas") &&
                    textoPregProf.includes("dictadas")
                  );

                // Resto (1, 2.a, 2.b, 2.c, 3...)
                return keywords.some((k) => textoPregProf.includes(k));
              });

              respuestasRelevantes.forEach((r) => {
                const val = r.texto || r.opcion_texto;
                if (val && !val.toLowerCase().includes("sin respuesta")) {
                  recopilacion.push(`• ${inf.materia_nombre}: ${val}`);
                }
              });
            });

            if (recopilacion.length > 0) {
              const textoUnico = Array.from(new Set(recopilacion)).join("\n");
              payloadRespuestas.push({
                pregunta_id: preguntaDestino.id,
                texto: textoUnico,
              });
            }
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
        setModal({
          open: true,
          type: "success",
          title: "¡Informe Guardado!",
          message: "El proceso ha finalizado correctamente.",
          onConfirm: () => navigate("/departamento/estadisticas"),
        });
      } else {
        throw new Error("Error backend");
      }
    } catch (e) {
      alert("Error de conexión.");
      setEnviando(false);
    }
  };

  if (loading)
    return <div className="p-10 text-center animate-pulse">Cargando...</div>;

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-8 bg-gray-100 min-h-screen font-sans">
      <ModalConfirmacion
        isOpen={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, open: false })}
        onConfirm={
          modal.onConfirm
            ? modal.onConfirm
            : () => setModal({ ...modal, open: false })
        }
      />
      <div className="bg-sky-50/90 backdrop-blur-md border border-sky-100 text-slate-800 rounded-xl shadow-sm p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-200 rounded-full opacity-20 -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 text-sky-900 tracking-tight">
            {datosInsumos?.titulo || "Cargando..."}
          </h1>
          <p className="text-slate-600 text-lg mb-6 font-light">
            {datosInsumos?.descripcion}
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="bg-white/60 px-4 py-2 rounded-lg text-sm font-medium border border-sky-200/50 text-sky-900 shadow-sm">
              📅 Ciclo: <strong>{datosInsumos?.anio}</strong>
            </span>
            <span className="bg-white/60 px-4 py-2 rounded-lg text-sm font-medium border border-sky-200/50 text-sky-900 shadow-sm">
              📍 Sede: <strong>{datosInsumos?.sede}</strong>
            </span>
            <span className="bg-white/60 px-4 py-2 rounded-lg text-sm font-medium border border-sky-200/50 text-sky-900 shadow-sm">
              🏢 Depto: <strong>{datosInsumos?.departamento}</strong>
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-[750px]">
            <div className="bg-sky-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2">
                Respuestas de Cátedras
              </h2>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Seleccionar Asignatura
              </label>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(Number(e.target.value))}
                className="block w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-lg shadow-sm bg-white cursor-pointer"
              >
                {datosInsumos?.informes_asignaturas?.map(
                  (asignatura, index) => (
                    <option key={asignatura.id} value={index}>
                      {asignatura.materia_nombre}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="p-8 bg-slate-50 overflow-y-auto flex-grow custom-scrollbar">
              {datosInsumos?.informes_asignaturas &&
              datosInsumos.informes_asignaturas[activeTab] ? (
                <div className="animate-fadeIn space-y-8">
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                        Materia
                      </p>
                      <h3 className="text-lg font-bold text-gray-800 leading-tight">
                        {
                          datosInsumos.informes_asignaturas[activeTab]
                            .materia_nombre
                        }
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                        Docente
                      </p>
                      <p className="text-sky-700 font-semibold bg-sky-50 px-2 py-1 rounded">
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
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 relative group hover:shadow-md transition-shadow"
                      >
                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-sky-500 rounded-r-md"></div>
                        <div className="pl-4">
                          <h4 className="font-bold text-slate-800 text-sm mb-3 group-hover:text-sky-700 transition-colors">
                            {resp.pregunta_texto}
                          </h4>
                          <div className="text-slate-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <span className="whitespace-pre-wrap">
                              {resp.texto || resp.opcion_texto || (
                                <em className="text-gray-400">
                                  Sin respuesta.
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
                  No hay informes disponibles.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl shadow-lg border border-sky-100 sticky top-6 flex flex-col h-[750px]">
            <div className="bg-sky-600 text-white px-6 py-4 font-semibold text-lg">
              Redacción Final
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              <div className="bg-sky-50 text-sky-900 text-sm p-4 rounded-lg border border-sky-100 mb-4">
                <p>
                  Complete los datos requeridos. Los campos técnicos se
                  generarán automáticamente.
                </p>
              </div>
              {preguntasClave.integrantes && (
                <div className="animate-fadeIn" id="campo-integrantes">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    {preguntasClave.integrantes.texto}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className={`w-full border rounded-lg p-4 text-sm min-h-[100px] ${
                      errorValidacion
                        ? "border-red-300 ring-2 ring-red-100"
                        : "border-gray-300 focus:ring-sky-500"
                    }`}
                    value={
                      respuestasUsuario[preguntasClave.integrantes.id] || ""
                    }
                    onChange={(e) => {
                      setRespuestasUsuario({
                        ...respuestasUsuario,
                        [preguntasClave.integrantes!.id]: e.target.value,
                      });
                      if (e.target.value.trim().length > 0)
                        setErrorValidacion(false);
                    }}
                  />
                </div>
              )}
              {preguntasClave.sintesis && (
                <div className="animate-fadeIn pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    {preguntasClave.sintesis.texto}
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-4 text-sm min-h-[250px] focus:ring-sky-500"
                    value={respuestasUsuario[preguntasClave.sintesis.id] || ""}
                    onChange={(e) =>
                      setRespuestasUsuario({
                        ...respuestasUsuario,
                        [preguntasClave.sintesis!.id]: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                onClick={iniciarGuardado}
                disabled={enviando}
                className="w-full py-4 rounded-lg font-bold text-white shadow-lg bg-green-600 hover:bg-green-700"
              >
                {enviando ? "Procesando..." : "Guardar y Cerrar Informe"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderInforme;
