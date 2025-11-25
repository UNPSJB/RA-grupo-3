import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Componentes de Secciones
import Seccion2 from "../components/informe_sintetico/Seccion2";
import Seccion2A from "../components/informe_sintetico/Seccion2A";
import Seccion2B from "../components/informe_sintetico/Seccion2B";
import Seccion2C from "../components/informe_sintetico/Seccion2C";
import Seccion3 from "../components/informe_sintetico/Seccion3";
import Seccion4 from "../components/informe_sintetico/Seccion4";

import { BotonTraerRespuestas } from "../components/informe_sintetico/BotonTraerRespuesta";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Componente local de Barra de Progreso
const BarraProgreso = ({ actual, total }: { actual: number; total: number }) => {
  const porcentaje = Math.min(100, Math.max(0, Math.round((actual / total) * 100)));
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

// --- Interfaces ---
interface InformeCurricular {
  id: number;
  estado: string;
  materia_nombre: string;
  materia_id: number;
  profesor_nombre: string;
  cuatrimestre_info: string;
  equipamiento?: string;
  bibliografia?: string;
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE";
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

// Interfaces para los datos del endpoint de estadísticas
interface ResultadoOpcionStats {
  opcion_texto: string;
  cantidad: number;
}
interface ResultadoPreguntaStats {
  pregunta_tipo: string;
  resultados_opciones: ResultadoOpcionStats[];
}
interface ResultadoSeccionStats {
  seccion_nombre: string;
  resultados_por_pregunta: ResultadoPreguntaStats[];
}
interface ResultadoCursadaStats {
  resultados_por_seccion: ResultadoSeccionStats[];
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
  const [activeTab, setActiveTab] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  const [informeCompletado, setInformeCompletado] = useState(false);

  const [cuatrimestreSeleccionado, setCuatrimestreSeleccionado] = useState<string>("");
  const [informeSeleccionadoId, setInformeSeleccionadoId] = useState<string>("todas");

  const opcionesCuatrimestre = useMemo(() => {
    if (!plantilla?.informes_curriculares_asociados) return [];
    const cuatris = plantilla.informes_curriculares_asociados.map((i) => i.cuatrimestre_info);
    return Array.from(new Set(cuatris)).sort();
  }, [plantilla]);

  useEffect(() => {
    if (opcionesCuatrimestre.length > 0 && !cuatrimestreSeleccionado) {
      setCuatrimestreSeleccionado(opcionesCuatrimestre[0]);
    }
  }, [opcionesCuatrimestre, cuatrimestreSeleccionado]);

  // 2. Cargar Datos del Informe
  useEffect(() => {
    if (!token) {
      setMensaje("Sesión expirada");
      return;
    }
    const load = async () => {
      try {
        if (!plantilla) setLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/departamento/instancia/${instanciaId}/detalles`,
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
          const filtrados = informesAsociados.filter(i => i.cuatrimestre_info === cuatrimestreSeleccionado);
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

  const informeSeleccionado = informeSeleccionadoId === "todas"
    ? null
    : informes.find((i) => i.id === Number(informeSeleccionadoId));

  const materiasFiltradas = informeSeleccionado ? [informeSeleccionado] : informes;

  const handleInputChange = (key: string, valor: string) => {
    setRespuestas((prev) => ({ ...prev, [key]: valor }));
    setMensaje(null);
  };

  const handleCopyContent = (texto: string, targetKey?: string) => {
    if (targetKey) {
      if (window.confirm("¿Reemplazar el contenido actual con el resumen de los profesores?")) {
        handleInputChange(targetKey, texto);
      }
    } else {
      navigator.clipboard.writeText(texto).then(() => {
        alert("Resumen copiado al portapapeles.\nPégalo en la celda correspondiente.");
      });
    }
  };

  // --- LÓGICA: AUTO-CALCULAR PORCENTAJES (Sección 2.B) ---
  const autoCompletarPorcentajes = async (preguntaId: number) => {
    if (!token) return;
    if (!confirm("¿Desea calcular y autocompletar los porcentajes desde las encuestas de alumnos? Esto sobrescribirá los valores actuales de la tabla.")) return;

    setLoading(true);
    const nuevasRespuestas = { ...respuestas };

    try {
      for (const materia of materiasFiltradas) {
        if (!materia.materia_id) continue;

        const res = await fetch(`${API_BASE_URL}/departamento/estadisticas/materia/${materia.materia_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data: ResultadoCursadaStats[] = await res.json();
          
          if (data.length > 0) {
            const resultado = data[0]; 
            
            const scores: Record<string, { s: number, c: number }> = { 
                B: { s: 0, c: 0 }, 
                C: { s: 0, c: 0 }, 
                D: { s: 0, c: 0 }, 
                ET: { s: 0, c: 0 }, 
                EP: { s: 0, c: 0 } 
            };

            resultado.resultados_por_seccion.forEach((sec) => {
              let key = "";
              if (sec.seccion_nombre.startsWith("B:")) key = "B";
              else if (sec.seccion_nombre.startsWith("C:")) key = "C";
              else if (sec.seccion_nombre.startsWith("D:")) key = "D";
              else if (sec.seccion_nombre.startsWith("E:")) {
                if (sec.seccion_nombre.includes("TEORÍA")) key = "ET";
                else if (sec.seccion_nombre.includes("PRÁCTICA")) key = "EP";
              }

              if (key) {
                sec.resultados_por_pregunta.forEach((p) => {
                  if (p.pregunta_tipo === "MULTIPLE_CHOICE" && p.resultados_opciones) {
                    p.resultados_opciones.forEach((opt) => {
                      const match = opt.opcion_texto.match(/\((\d)\)/);
                      if (match && opt.cantidad > 0) {
                        const val = parseInt(match[1]);
                        scores[key].s += val * opt.cantidad;
                        scores[key].c += opt.cantidad;
                      }
                    });
                  }
                });
              }
            });

            Object.entries(scores).forEach(([colKey, val]) => {
              const avg = val.c > 0 ? val.s / val.c : 0;
              const percent = (avg / 4) * 100;
              
              const finalVal = percent > 0 ? `${percent.toFixed(0)}%` : "-";
              
              nuevasRespuestas[`p${preguntaId}_m${materia.id}_${colKey}`] = finalVal;
            });
          }
        }
      }
      setRespuestas(nuevasRespuestas);
      alert("Cálculo completado con éxito.");
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error al intentar calcular los porcentajes.");
    } finally {
      setLoading(false);
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

  // --- LÓGICA DE ENVÍO ---
  const handleFinalizar = async () => {
    if (!confirm("¿Está seguro de enviar el informe? Pasará a estado COMPLETADO.")) return;
    setCargandoEnvio(true);

    const answersMap = new Map<number, string>();
    
    Object.entries(respuestas).forEach(([key, val]) => {
        if (!isNaN(Number(key))) {
            answersMap.set(Number(key), String(val));
        }
    });

    plantilla?.secciones.forEach(sec => {
        sec.preguntas.forEach(preg => {
            const compositeKeys = Object.keys(respuestas).filter(k => k.startsWith(`p${preg.id}_`));
            
            if (compositeKeys.length > 0) {
                const tableData: Record<string, Record<string, string>> = {};
                
                compositeKeys.forEach(k => {
                    const parts = k.split('_'); 
                    if (parts.length >= 3) {
                        const mId = parts[1]; 
                        const col = parts.slice(2).join('_'); // B, C, etc.
                        
                        if (!tableData[mId]) tableData[mId] = {};
                        tableData[mId][col] = String(respuestas[k]);
                    }
                });
                
                answersMap.set(preg.id, JSON.stringify(tableData));
            }
        });
    });

    const payload = Array.from(answersMap.entries()).map(([pid, val]) => ({
        pregunta_id: pid,
        texto: val
    }));

    try {
      const res = await fetch(
        `${API_BASE_URL}/departamento/instancia/${instanciaId}/responder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ respuestas: payload }),
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

  // --- RENDERIZADO ---

  if (loading) return <div className="py-20 text-center text-gray-500 animate-pulse">Cargando datos del informe...</div>;

  if (informeCompletado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-fadeIn">
        <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-100 max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Informe Enviado!</h3>
          <p className="text-gray-600 mb-8">El informe sintético ha sido registrado correctamente.</p>
          <button onClick={() => navigate("/departamento")} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium">Volver al Panel</button>
        </div>
      </div>
    );
  }

  if (!plantilla) return <div className="p-10 text-center text-red-500">Error cargando plantilla.</div>;

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm mt-6 border border-gray-200 mb-20">
      <div className="pb-6 mb-6 border-b border-gray-100 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-2">{plantilla.titulo}</h1>
        <p className="text-gray-500 max-w-3xl mx-auto">{plantilla.descripcion}</p>
      </div>

      <BarraProgreso actual={activeTab + 1} total={plantilla.secciones.length} />

      {/* Pestañas Visuales */}
      <div className="hidden sm:flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
        {plantilla.secciones.map((sec, i) => (
          <div key={sec.id} className={`py-3 px-5 whitespace-nowrap font-medium text-sm border-b-2 ${activeTab === i ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" : "border-transparent text-gray-400"}`}>
            <span className="mr-2 text-xs font-bold">{i + 1}.</span>{sec.nombre}
          </div>
        ))}
      </div>

      {/* Contenido Dinámico */}
      <div className="animate-fadeIn min-h-[300px]">
        {plantilla.secciones.map((sec, index) => (
          <div key={sec.id} className={activeTab === index ? "block" : "hidden"}>
            
            {/* Sección 2: Renderizado Especial para las tablas */}
            {index === 2 && (
                <div className="space-y-8">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-800 text-sm mb-4">
                        <p><strong>Nota:</strong> Utilice los botones para traer datos de los informes de profesores o calcular estadísticas automáticamente.</p>
                    </div>
                    {sec.preguntas.map((p) => {
                        const props = { materiasFiltradas: materiasFiltradas as any, respuestas, handleInputChange, preguntaId: p.id };
                        
                        if (p.texto.startsWith("2.B")) {
                            return (
                                <div key={p.id} className="bg-white p-1 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="mb-4 flex justify-between items-center border-b pb-3">
                                        <p className="font-bold text-gray-800 text-lg">{p.texto}</p>
                                        <button 
                                            onClick={() => autoCompletarPorcentajes(p.id)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 shadow-sm transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Calcular desde Encuestas
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Seccion2B {...props} />
                                    </div>
                                </div>
                            );
                        }

                        let Componente = Seccion2;
                        let prefijo = "2.";
                        if (p.texto.startsWith("2.A")) { prefijo = "2.A"; Componente = Seccion2A; }
                        else if (p.texto.startsWith("2.C")) { prefijo = "2.C"; Componente = Seccion2C; }

                        return (
                            <div key={p.id} className="bg-white p-1 sm:p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                                <div className="mb-4 flex justify-between items-center border-b pb-3">
                                    <p className="font-bold text-gray-800 text-lg">{p.texto}</p>
                                    <BotonTraerRespuestas instanciaId={instanciaId!} seccionPrefijo={prefijo} onCopy={(t) => handleCopyContent(t)} />
                                </div>
                                <div className="overflow-x-auto">
                                    <Componente {...props} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Renderizado Genérico para otras secciones (0, 1, 3, 4, etc) */}
            {index !== 2 && (
                <div className="space-y-6">
                    {/* Caso especial: Sección 0 (Tabla resumen de materias) */}
                    {index === 0 && (
                        <>
                            <div className="flex gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                                <label className="font-medium text-gray-700 self-center">Filtrar por Cuatrimestre:</label>
                                <select 
                                    className="border border-gray-300 rounded p-2 bg-white"
                                    value={cuatrimestreSeleccionado}
                                    onChange={(e) => setCuatrimestreSeleccionado(e.target.value)}
                                    disabled={opcionesCuatrimestre.length === 0}
                                >
                                    {opcionesCuatrimestre.map(op => <option key={op} value={op}>{op}</option>)}
                                </select>
                            </div>
                            {/* Aquí podrías renderizar la tabla resumen de informes si lo deseas */}
                        </>
                    )}

                    {sec.preguntas.map((p) => {
                        if (p.texto.startsWith("3.")) {
                            return (
                                <div key={p.id} className="bg-white p-4 rounded-lg border shadow-sm">
                                    <div className="flex justify-between mb-4">
                                        <p className="font-bold">{p.texto}</p>
                                        <BotonTraerRespuestas instanciaId={instanciaId!} seccionPrefijo="3." onCopy={(t) => handleCopyContent(t)} />
                                    </div>
                                    <Seccion3 materiasFiltradas={materiasFiltradas as any} respuestas={respuestas} handleInputChange={handleInputChange} preguntaId={p.id} />
                                </div>
                            );
                        }
                        if (p.texto.startsWith("4.")) {
                            return (
                                <div key={p.id} className="bg-white p-4 rounded-lg border shadow-sm">
                                    <div className="flex justify-between mb-4">
                                        <p className="font-bold">{p.texto}</p>
                                        <BotonTraerRespuestas instanciaId={instanciaId!} seccionPrefijo="4." onCopy={(t) => handleCopyContent(t)} />
                                    </div>
                                    <Seccion4 materiasFiltradas={materiasFiltradas as any} respuestas={respuestas} handleInputChange={handleInputChange} preguntaId={p.id} />
                                </div>
                            );
                        }

                        // Default: Redacción simple
                        return (
                            <div key={p.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <label className="block font-medium text-gray-900 text-lg mb-4">{p.texto}</label>
                                <div className="mb-3">
                                    <BotonTraerRespuestas instanciaId={instanciaId!} seccionPrefijo={p.texto.split(" ")[0]} onCopy={(t) => handleCopyContent(t, p.id.toString())} />
                                </div>
                                <textarea
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[150px]"
                                    placeholder="Escriba aquí..."
                                    value={respuestas[p.id.toString()] || ""}
                                    onChange={(e) => handleInputChange(p.id.toString(), e.target.value)}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
          </div>
        ))}
      </div>

      {/* Botonera Footer */}
      <div className="flex justify-between items-center pt-8 mt-10 border-t border-gray-200">
        <button onClick={irAnterior} disabled={activeTab === 0} className="flex items-center px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">← Anterior</button>
        {plantilla && activeTab < plantilla.secciones.length - 1 ? (
          <button onClick={irSiguiente} className="flex items-center px-6 py-2.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm">Siguiente →</button>
        ) : (
          <button onClick={handleFinalizar} disabled={cargandoEnvio} className="flex items-center px-8 py-2.5 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-md disabled:bg-green-400">
            {cargandoEnvio ? "Enviando..." : "Finalizar Informe"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ResponderInforme;