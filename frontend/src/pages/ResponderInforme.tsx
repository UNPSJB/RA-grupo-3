import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Componentes de Secciones (Asumiendo que existen en tu proyecto)
import Seccion2 from "../components/informe_sintetico/Seccion2";
import Seccion2A from "../components/informe_sintetico/Seccion2A";
import Seccion2B from "../components/informe_sintetico/Seccion2B";
import Seccion2C from "../components/informe_sintetico/Seccion2C";
import Seccion3 from "../components/informe_sintetico/Seccion3";
import Seccion4 from "../components/informe_sintetico/Seccion4";

// Componente del Botón Visual
import { BotonTraerRespuestas } from "../components/informe_sintetico/BotonTraerRespuesta";

// Componente simple de Barra de Progreso (Si ya tienes uno global, impórtalo)
const BarraProgreso = ({
  actual,
  total,
}: {
  actual: number;
  total: number;
}) => {
  const porcentaje = Math.min(
    100,
    Math.max(0, Math.round((actual / total) * 100))
  );
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
      <div
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${porcentaje}%` }}
      ></div>
      <div className="text-right text-xs text-gray-500 mt-1 font-medium">
        Paso {actual} de {total}
      </div>
    </div>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- Interfaces ---
interface InformeCurricular {
  id: number;
  estado: string;
  materia_nombre: string;
  profesor_nombre: string;
  cuatrimestre_info: string;
  equipamiento?: string;
  bibliografia?: string;
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE" | "TABLA_COMPLEJA"; // Agregado tipo
  opciones?: { id: number; texto: string }[] | null;
  origen_datos?: string | null;
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
  informes_curriculares_asociados?: InformeCurricular[];
}

const ResponderInforme: React.FC = () => {
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  // Estados de datos
  const [plantilla, setPlantilla] = useState<PlantillaInforme | null>(null);
  const [informes, setInformes] = useState<InformeCurricular[]>([]);
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({});

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // Ahora actúa como índice de paso
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  const [informeCompletado, setInformeCompletado] = useState(false);

  // Filtros
  const [cuatrimestreSeleccionado, setCuatrimestreSeleccionado] =
    useState<string>("");
  const [informeSeleccionadoId, setInformeSeleccionadoId] =
    useState<string>("todas");

  // 1. Calcular Cuatrimestres Disponibles
  const opcionesCuatrimestre = useMemo(() => {
    if (!plantilla?.informes_curriculares_asociados) return [];
    const cuatris = plantilla.informes_curriculares_asociados.map(
      (i) => i.cuatrimestre_info
    );
    return Array.from(new Set(cuatris)).sort();
  }, [plantilla]);

  // 2. Auto-seleccionar el primer cuatrimestre
  useEffect(() => {
    if (opcionesCuatrimestre.length > 0 && !cuatrimestreSeleccionado) {
      setCuatrimestreSeleccionado(opcionesCuatrimestre[0]);
    }
  }, [opcionesCuatrimestre, cuatrimestreSeleccionado]);

  // 3. Cargar Datos del Informe
  useEffect(() => {
    if (!token) {
      setMensaje("Sesión expirada");
      return;
    }
    const load = async () => {
      try {
        if (!plantilla) setLoading(true);
        // Ajusta la URL según tu backend real
        const res = await fetch(
          `${API_BASE_URL}/departamento/instancia/${instanciaId}/detalles?departamento_id=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          if (res.status === 401) logout();
          throw new Error("Error cargando plantilla o sesión inválida");
        }

        const data: PlantillaInforme = await res.json();
        setPlantilla(data);

        // Filtrar informes según el cuatrimestre seleccionado
        const informesAsociados = data.informes_curriculares_asociados || [];
        if (cuatrimestreSeleccionado) {
          const filtrados = informesAsociados.filter(
            (i) => i.cuatrimestre_info === cuatrimestreSeleccionado
          );
          setInformes(filtrados);
          if (filtrados.length > 0) setInformeSeleccionadoId("todas");
        } else {
          setInformes([]);
        }
      } catch (e) {
        setMensaje(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [instanciaId, token, cuatrimestreSeleccionado, logout]);

  // Filtrado local de materias para las tablas
  const informeSeleccionado =
    informeSeleccionadoId === "todas"
      ? null
      : informes.find((i) => i.id === Number(informeSeleccionadoId));

  const materiasFiltradas = informeSeleccionado
    ? [informeSeleccionado]
    : informes;

  const handleInputChange = (key: string, valor: string) => {
    setRespuestas((prev) => ({ ...prev, [key]: valor }));
    setMensaje(null); // Limpiar errores al escribir
  };

  // --- LÓGICA DE COPIADO ---
  const handleCopyContent = (texto: string, targetKey?: string) => {
    if (targetKey) {
      if (
        window.confirm(
          "¿Reemplazar el contenido actual con el resumen de los profesores?"
        )
      ) {
        handleInputChange(targetKey, texto);
      }
    } else {
      navigator.clipboard.writeText(texto).then(() => {
        alert(
          "Resumen copiado al portapapeles.\nPégalo en la celda correspondiente."
        );
      });
    }
  };

  // --- LÓGICA DE NAVEGACIÓN ---
  const irSiguiente = () => {
    if (plantilla && activeTab < plantilla.secciones.length - 1) {
      setActiveTab((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const irAnterior = () => {
    if (activeTab > 0) {
      setActiveTab((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  // --- VALIDACIÓN DE SECCIÓN (Opcional, pero recomendada) ---
  // A diferencia de la encuesta, un informe puede ser guardado parcialmente.
  // Aquí devolvemos true siempre para no bloquear, o podrías implementar lógica estricta.
  const isSeccionActualValida = useMemo(() => {
    // Si quisieras bloquear el avance si está vacío, hazlo aquí.
    // Por ahora, permitimos navegación libre para facilitar borradores.
    return true;
  }, [activeTab, respuestas]);

  const handleFinalizar = async () => {
    if (
      !confirm("¿Está seguro de enviar el informe? Pasará a estado COMPLETADO.")
    )
      return;
    setCargandoEnvio(true);

    const payloadRespuestas = Object.entries(respuestas)
      .map(([key, val]) => {
        if (!isNaN(Number(key))) {
          return { pregunta_id: Number(key), texto: val };
        }
        // Aquí manejarías respuestas complejas de tablas si tu backend lo requiere de otra forma
        return null;
      })
      .filter(Boolean);

    try {
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
        setInformeCompletado(true);
        window.scrollTo(0, 0);
      } else {
        throw new Error("Error al enviar el informe.");
      }
    } catch (e) {
      console.error(e);
      setMensaje("Hubo un error al intentar enviar el informe.");
    } finally {
      setCargandoEnvio(false);
    }
  };

  // --- RENDERIZADO DE PANTALLAS DE CARGA/ERROR/ÉXITO ---

  if (loading)
    return (
      <div className="py-20 text-center text-gray-500 animate-pulse">
        <p>Cargando datos del informe...</p>
      </div>
    );

  if (informeCompletado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-fadeIn">
        <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-100 max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
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
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Informe Enviado!
          </h3>
          <p className="text-gray-600 mb-8">
            El informe sintético ha sido registrado correctamente en el sistema.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate("/departamento")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-md font-medium"
            >
              Volver al Panel
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plantilla)
    return (
      <p className="text-center mt-8 text-red-600 font-medium bg-red-50 p-4 rounded border border-red-200 mx-auto max-w-2xl">
        {mensaje || "No se pudo cargar la plantilla del informe."}
      </p>
    );

  // --- RENDERIZADO PRINCIPAL ---
  const seccionActual = plantilla.secciones[activeTab];

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm mt-6 border border-gray-200 mb-20">
      {/* Cabecera */}
      <div className="pb-6 mb-6 border-b border-gray-100 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-2">
          {plantilla.titulo}
        </h1>
        <p className="text-gray-500 max-w-3xl mx-auto">
          {plantilla.descripcion}
        </p>
      </div>

      {/* Barra de Progreso */}
      <BarraProgreso
        actual={activeTab + 1}
        total={plantilla.secciones.length}
      />

      {/* Pestañas (Solo visuales, no clickeables para forzar flujo) */}
      <div className="hidden sm:flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
        {plantilla.secciones.map((sec, i) => (
          <div
            key={sec.id}
            className={`py-3 px-5 whitespace-nowrap font-medium text-sm transition-colors border-b-2 cursor-default ${
              activeTab === i
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                : i < activeTab
                ? "border-green-400 text-green-600" // Pasos anteriores completados
                : "border-transparent text-gray-400"
            }`}
          >
            {/* Si el nombre es muy largo, cortarlo o usar número */}
            <span className="mr-2 text-xs font-bold">{i + 1}.</span>
            {sec.nombre}
          </div>
        ))}
      </div>

      {/* Título de la Sección Móvil (Visible solo en móvil) */}
      <div className="sm:hidden mb-6 bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-center">
        <span className="text-xs uppercase tracking-wide text-indigo-500 font-bold block mb-1">
          Sección Actual
        </span>
        <h2 className="text-lg font-bold text-indigo-900">
          {seccionActual.nombre}
        </h2>
      </div>

      {/* --- CONTENIDO DINÁMICO --- */}
      <div className="animate-fadeIn min-h-[300px]">
        {plantilla.secciones.map((sec, index) => (
          <div
            key={sec.id}
            className={activeTab === index ? "block" : "hidden"}
          >
            {/* --- SECCIÓN 0: Info General (Tabla Resumen) --- */}
            {index === 0 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm">
                  <p>
                    <strong>Instrucciones:</strong> Seleccione el cuatrimestre
                    para filtrar la información. Revise el listado de materias
                    antes de continuar.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="font-medium text-gray-700">
                    Filtrar por Cuatrimestre:
                  </label>
                  <select
                    className="border border-gray-300 rounded-md p-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={cuatrimestreSeleccionado}
                    onChange={(e) =>
                      setCuatrimestreSeleccionado(e.target.value)
                    }
                    disabled={opcionesCuatrimestre.length === 0}
                  >
                    {opcionesCuatrimestre.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preguntas de texto de la sección 0 si las hubiera */}
                {sec.preguntas.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-gray-50 rounded border border-gray-200"
                  >
                    <p className="font-semibold text-gray-800">{p.texto}</p>
                  </div>
                ))}

                <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold">
                          Materia / Profesor
                        </th>
                        <th className="px-4 py-3 text-center font-bold">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-center font-bold">
                          Detalle
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {informes.length > 0 ? (
                        informes.map((inf) => (
                          <tr
                            key={inf.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {inf.materia_nombre}
                              </div>
                              <div className="text-xs text-gray-500">
                                {inf.profesor_nombre}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  inf.estado === "COMPLETADO"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {inf.estado || "PENDIENTE"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-400 text-xs">
                              #{inf.id}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No hay informes asociados a este cuatrimestre.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- SECCIÓN 1: Equipamiento y Bibliografía --- */}
            {index === 1 && (
              <div className="space-y-8">
                {sec.preguntas.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3"
                  >
                    <label className="block text-lg font-medium text-gray-800 border-l-4 border-indigo-500 pl-3">
                      {p.texto}
                    </label>

                    <BotonTraerRespuestas
                      instanciaId={instanciaId!}
                      seccionPrefijo="1."
                      onCopy={(texto) =>
                        handleCopyContent(texto, p.id.toString())
                      }
                    />

                    <textarea
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 leading-relaxed"
                      rows={6}
                      placeholder={`Resumen de ${p.texto.toLowerCase()}...`}
                      value={respuestas[p.id.toString()] || ""}
                      onChange={(e) =>
                        handleInputChange(p.id.toString(), e.target.value)
                      }
                    />
                  </div>
                ))}

                {/* Tabla de Referencia (Solo lectura) */}
                <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">
                    Datos de Referencia (Profesores)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold w-1/4">
                            Materia
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Equipamiento Solicitado
                          </th>
                          <th className="px-3 py-2 text-left font-bold">
                            Bibliografía Solicitada
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {materiasFiltradas.map((inf) => (
                          <tr key={inf.id}>
                            <td className="px-3 py-2 font-medium text-indigo-900 border-r">
                              {inf.materia_nombre}
                            </td>
                            <td className="px-3 py-2 text-gray-600 whitespace-pre-wrap border-r">
                              {inf.equipamiento || "-"}
                            </td>
                            <td className="px-3 py-2 text-gray-600 whitespace-pre-wrap">
                              {inf.bibliografia || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- SECCIONES COMPLEJAS (2, 2A, 2B, 2C) --- */}
            {index === 2 && (
              <div className="space-y-8">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-800 text-sm mb-4">
                  <p>
                    <strong>Nota:</strong> Utilice los botones "Copiar" para
                    traer los datos numéricos de los informes de los profesores.
                    Luego puede editar los valores si es necesario.
                  </p>
                </div>
                {sec.preguntas.map((p) => {
                  const props = {
                    materiasFiltradas,
                    respuestas,
                    handleInputChange,
                    preguntaId: p.id,
                  };

                  let prefijo = "2.";
                  let Componente = Seccion2;

                  if (p.texto.startsWith("2.A")) {
                    prefijo = "2.A";
                    Componente = Seccion2A;
                  } else if (p.texto.startsWith("2.B")) {
                    prefijo = "2.B";
                    Componente = Seccion2B;
                  } else if (p.texto.startsWith("2.C")) {
                    prefijo = "2.C";
                    Componente = Seccion2C;
                  }

                  return (
                    <div
                      key={p.id}
                      className="bg-white p-1 sm:p-4 rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                        <p className="font-bold text-gray-800 text-lg">
                          {p.texto}
                        </p>
                        <div className="shrink-0">
                          <BotonTraerRespuestas
                            instanciaId={instanciaId!}
                            seccionPrefijo={prefijo}
                            onCopy={(t) => handleCopyContent(t)}
                          />
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <Componente {...props} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- SECCIÓN 3: Actividades --- */}
            {index === 3 && (
              <div className="space-y-8">
                {sec.preguntas.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                      <p className="font-medium text-gray-800 border-l-4 border-indigo-500 pl-3">
                        {p.texto}
                      </p>
                      <BotonTraerRespuestas
                        instanciaId={instanciaId!}
                        seccionPrefijo="3."
                        onCopy={(t) => handleCopyContent(t)}
                      />
                    </div>
                    <Seccion3
                      materiasFiltradas={materiasFiltradas}
                      respuestas={respuestas}
                      handleInputChange={handleInputChange}
                      preguntaId={p.id}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* --- SECCIÓN 4: Auxiliares --- */}
            {index === 4 && (
              <div className="space-y-8">
                {sec.preguntas.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                      <p className="font-medium text-gray-800 border-l-4 border-indigo-500 pl-3">
                        {p.texto}
                      </p>
                      <BotonTraerRespuestas
                        instanciaId={instanciaId!}
                        seccionPrefijo="4."
                        onCopy={(t) => handleCopyContent(t)}
                      />
                    </div>
                    <Seccion4
                      materiasFiltradas={materiasFiltradas}
                      respuestas={respuestas}
                      handleInputChange={handleInputChange}
                      preguntaId={p.id}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* --- SECCIONES GENERALES (Redacción Libre / Observaciones) --- */}
            {index > 4 && (
              <div className="space-y-6">
                {sec.preguntas.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md"
                  >
                    <label className="block font-medium text-gray-900 text-lg mb-4">
                      {p.texto}
                    </label>

                    {p.tipo === "REDACCION" && (
                      <>
                        <div className="mb-3">
                          <BotonTraerRespuestas
                            instanciaId={instanciaId!}
                            seccionPrefijo={p.texto.split(" ")[0]}
                            onCopy={(texto) =>
                              handleCopyContent(texto, p.id.toString())
                            }
                          />
                        </div>
                        <textarea
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[200px]"
                          placeholder="Escriba aquí sus observaciones o conclusiones finales..."
                          value={respuestas[p.id.toString()] || ""}
                          onChange={(e) =>
                            handleInputChange(p.id.toString(), e.target.value)
                          }
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- BOTONERA DE NAVEGACIÓN --- */}
      <div className="flex justify-between items-center pt-8 mt-10 border-t border-gray-200">
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={irAnterior}
          disabled={activeTab === 0}
          className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 0
              ? "text-gray-300 bg-gray-50 cursor-not-allowed"
              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:shadow-sm"
          }`}
        >
          <span className="mr-2">←</span> Anterior
        </button>

        {/* Mensaje de error si existe */}
        {mensaje && (
          <div className="hidden sm:block text-red-600 bg-red-50 px-4 py-2 rounded text-sm font-medium border border-red-200 animate-pulse">
            {mensaje}
          </div>
        )}

        {/* Botón Siguiente / Finalizar */}
        {plantilla && activeTab < plantilla.secciones.length - 1 ? (
          <button
            type="button"
            onClick={irSiguiente}
            disabled={!isSeccionActualValida}
            className={`flex items-center px-6 py-2.5 rounded-lg font-bold text-white transition-all shadow-sm ${
              !isSeccionActualValida
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md transform hover:-translate-y-0.5"
            }`}
          >
            Siguiente <span className="ml-2">→</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalizar}
            disabled={cargandoEnvio}
            className={`flex items-center px-8 py-2.5 rounded-lg font-bold text-white transition-all shadow-md ${
              cargandoEnvio
                ? "bg-green-400 cursor-wait"
                : "bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {cargandoEnvio ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enviando...
              </>
            ) : (
              "Finalizar Informe"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ResponderInforme;
