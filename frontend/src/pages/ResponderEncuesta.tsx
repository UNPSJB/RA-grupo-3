import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.tsx";
import BarraProgreso from "../components/estadisticas/BarraProgreso.tsx";

// --- Interfaces ---
interface Opcion {
  id: number;
  texto: string;
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: string;
  opciones: Opcion[];
}

interface Seccion {
  id: number;
  nombre: string;
  preguntas: Pregunta[];
}

interface PlantillaEncuesta {
  id: number;
  titulo: string;
  descripcion?: string;
  secciones: Seccion[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ResponderEncuesta: React.FC = () => {
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout } = useAuth();

  const { materiaNombre, profesorNombre } = (location.state as {
    materiaNombre?: string;
    profesorNombre?: string;
  }) || { materiaNombre: "Encuesta", profesorNombre: undefined };

  const [plantilla, setPlantilla] = useState<PlantillaEncuesta | null>(null);
  const [respuestas, setRespuestas] = useState<{
    [preguntaId: number]: string | number;
  }>({});

  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [encuestaCompletada, setEncuestaCompletada] = useState(false);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const [errorPreguntaId, setErrorPreguntaId] = useState<number | null>(null);

  const totalPreguntas = useMemo(() => {
    if (!plantilla) return 0;
    return plantilla.secciones.reduce(
      (acc, seccion) => acc + seccion.preguntas.length,
      0
    );
  }, [plantilla]);

  const respuestasCount = useMemo(() => {
    return Object.values(respuestas).filter(
      (v) => v !== "" && v !== undefined && v !== null
    ).length;
  }, [respuestas]);

  const isSeccionActualCompleta = useMemo(() => {
    if (!plantilla || !plantilla.secciones[activeTab]) return false;
    const seccionActual = plantilla.secciones[activeTab];
    //Filtramos las preguntas que son obligatorias
    const preguntasObligatorias = seccionActual.preguntas.filter(
      (p) => p.tipo === "MULTIPLE_CHOICE"
    );
    //Veo si hay valor en el estado de respuestas
    return preguntasObligatorias.every((p) => {
      const valor = respuestas[p.id];
      return valor !== undefined && valor !== null && valor !== "";
    });
  }, [plantilla, activeTab, respuestas]);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setLoading(false);
      setMensaje("Necesitas iniciar sesión para responder la encuesta.");
      return;
    }

    const fetchPlantillaParaInstancia = async () => {
      setLoading(true);
      setMensaje(null);
      setPlantilla(null);
      setErrorPreguntaId(null);
      setActiveTab(0);

      if (!instanciaId || isNaN(Number(instanciaId))) {
        setMensaje("ID de instancia inválido en la URL.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/encuestas-abiertas/instancia/${instanciaId}/detalles`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
            return;
          }
          let errorDetail = `Error ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) {}
          if (response.status === 404) {
            setMensaje(
              "La encuesta solicitada no se encontró o ya no está activa."
            );
          } else {
            setMensaje(errorDetail);
          }
          throw new Error(errorDetail);
        }
        const plantillaData: PlantillaEncuesta = await response.json();

        if (isMounted) {
          setPlantilla(plantillaData);
        }
      } catch (error) {
        console.error("Error al obtener la plantilla:", error);
        if (isMounted && !mensaje) {
          setMensaje(
            `Error al cargar la encuesta: ${
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

    fetchPlantillaParaInstancia();

    return () => {
      isMounted = false;
    };
  }, [instanciaId, token, logout]);

  const manejarCambio = (preguntaId: number, valor: string | number) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
    if (errorPreguntaId === preguntaId) {
      setErrorPreguntaId(null);
      setMensaje(null);
    }
  };

  // Nuevos Handlers de Navegación
  const irSiguiente = () => {
    if (plantilla && activeTab < plantilla.secciones.length - 1) {
      setActiveTab(activeTab + 1);
      window.scrollTo(0, 0); // Subir al inicio al cambiar de página
    }
  };

  const irAnterior = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setMensaje("Tu sesión expiró. Por favor, inicia sesión de nuevo.");
      logout();
      return;
    }

    if (!instanciaId || !plantilla) return;

    setErrorPreguntaId(null);
    setMensaje(null);

    // Validación global de obligatorias antes de enviar
    const preguntasObligatorias = plantilla.secciones
      .flatMap((s) => s.preguntas)
      .filter((p) => p.tipo === "MULTIPLE_CHOICE");

    const primeraPreguntaSinRespuesta = preguntasObligatorias.find(
      (p) => !respuestas[p.id]
    );

    if (primeraPreguntaSinRespuesta) {
      // Encontrar en qué sección está la pregunta que falta
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

      // Si la pregunta está en otra sección, llevamos al usuario ahí
      if (tabIndex !== -1 && tabIndex !== activeTab) {
        setActiveTab(tabIndex);
      }

      setErrorPreguntaId(primeraPreguntaSinRespuesta.id);
      setMensaje(
        "Faltan preguntas obligatorias (*). Hemos resaltado la que falta."
      );

      // Pequeño scroll hacia el mensaje de error o la pregunta
      window.scrollTo(0, 200);
      return;
    }

    setCargandoEnvio(true);

    const payload = {
      respuestas: Object.entries(respuestas).map(([preguntaId, valor]) => ({
        pregunta_id: Number(preguntaId),
        opcion_id: typeof valor === "number" ? valor : undefined,
        texto: typeof valor === "string" ? valor : undefined,
      })),
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/encuestas-abiertas/instancia/${instanciaId}/responder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }
        let errorDetail = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch (e) {}
        throw new Error(errorDetail);
      }

      setMensaje("¡Respuestas enviadas correctamente!");
      setEncuestaCompletada(true);
    } catch (error) {
      console.error("Error al enviar:", error);
      setMensaje(
        `Error al enviar respuestas: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setCargandoEnvio(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-8 animate-pulse text-gray-500">
        Cargando encuesta...
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
        No se encontró la información de la encuesta.
      </p>
    );

  if (encuestaCompletada) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24"
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
            ¡Respuestas enviadas correctamente!
          </h3>
          <p className="text-gray-600 mb-4">
            Gracias por completar la encuesta.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/alumno/encuestas")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Ver mis encuestas
            </button>
            <button
              onClick={() => navigate("/")}
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
    <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md mt-6 mb-8 border border-gray-200">
      <div className="pb-4 mb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-center text-indigo-800">
          {materiaNombre || "Encuesta"}
        </h1>
        {profesorNombre && (
          <p className="text-sm text-gray-600 text-center mt-1">
            Profesor: {profesorNombre}
          </p>
        )}
      </div>

      <BarraProgreso actual={respuestasCount} total={totalPreguntas} />

      {/* --- Pestañas: Solo visuales (No clickeables) --- */}
      <div className="flex border-b border-gray-300 mb-6 -mx-6 sm:-mx-8 px-6 sm:px-8 overflow-x-auto">
        {plantilla.secciones?.map((seccion, index) => (
          <button
            key={seccion.id}
            type="button"
            disabled
            className={`py-3 px-5 font-medium text-sm whitespace-nowrap transition-colors duration-150 cursor-default ${
              activeTab === index
                ? "border-b-2 border-indigo-600 text-indigo-600 font-bold"
                : "text-gray-400"
            }`}
            title={seccion.nombre}
          >
            {seccion.nombre.includes(":")
              ? seccion.nombre.split(":")[0]
              : `Parte ${index + 1}`}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- Contenido de la Sección Activa --- */}
        <div>
          {plantilla.secciones?.map((seccion, index) => (
            <div
              key={seccion.id}
              className={
                activeTab === index
                  ? "block space-y-5 animate-fadeIn"
                  : "hidden"
              }
            >
              {/* Título de la sección para contexto */}
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                {seccion.nombre}
              </h3>

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
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out"
                        placeholder="Escribe tu respuesta..."
                        rows={4}
                        value={String(respuestas[pregunta.id] ?? "")}
                        onChange={(e) =>
                          manejarCambio(pregunta.id, e.target.value)
                        }
                      />
                    ) : esMultipleChoice ? (
                      <div className="space-y-2">
                        {pregunta.opciones.map((opcion) => (
                          <label
                            key={opcion.id}
                            className="flex items-center space-x-3 cursor-pointer p-3 rounded hover:bg-indigo-50 transition-colors"
                          >
                            <input
                              type="radio"
                              name={`pregunta-${pregunta.id}`}
                              value={opcion.id}
                              checked={
                                Number(respuestas[pregunta.id]) === opcion.id
                              }
                              onChange={() =>
                                manejarCambio(pregunta.id, opcion.id)
                              }
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="text-gray-700">
                              {opcion.texto}
                            </span>
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

        {mensaje && (
          <div
            className={`text-center font-medium p-4 rounded border ${
              mensaje.toLowerCase().includes("error") ||
              mensaje.includes("Faltan")
                ? "text-red-700 bg-red-100 border-red-300"
                : "text-green-700 bg-green-100 border-green-300"
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* --- Botonera de Navegación --- */}
        <div className="flex justify-between items-center pt-6 mt-8 border-t border-gray-200">
          {/* Botón Anterior */}
          <button
            type="button"
            onClick={irAnterior}
            disabled={activeTab === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors border ${
              activeTab === 0
                ? "text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50"
                : "text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            ← Anterior
          </button>

          {/* Botón Siguiente o Finalizar */}
          {activeTab < (plantilla.secciones.length || 0) - 1 ? (
            <button
              type="button"
              onClick={irSiguiente}
              disabled={!isSeccionActualCompleta}
              className={`px-6 py-2.5 rounded-lg font-semibold transition duration-150 ease-in-out shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                !isSeccionActualCompleta
                  ? "bg-indigo-300 text-white cursor-not-allowed" // Estilo deshabilitado
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow focus:ring-indigo-500" // Estilo habilitado
              }`}
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="submit"
              disabled={cargandoEnvio || !isSeccionActualCompleta}
              className={`px-8 py-2.5 rounded-lg font-semibold transition duration-150 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                cargandoEnvio || !isSeccionActualCompleta
                  ? "bg-green-300 text-white cursor-not-allowed" // Estilo deshabilitado
                  : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg focus:ring-green-500" // Estilo habilitado
              }`}
            >
              {cargandoEnvio ? "Enviando..." : "Finalizar y Enviar"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ResponderEncuesta;
