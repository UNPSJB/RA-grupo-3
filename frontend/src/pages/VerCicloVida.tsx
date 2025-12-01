import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- Interfaces ---
interface Materia {
  nombre: string;
}
interface Cursada {
  materia: Materia;
}
interface Encuesta {
  id: number;
  estado: string;
  cursada: Cursada;
}
interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio_encuesta: string;
  fecha_fin_encuesta: string;
  fecha_limite_informe: string | null;
  fecha_limite_sintetico: string | null;
  encuestas: Encuesta[];
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "Sin definir";
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// --- COMPONENTE DE TARJETA ---
const PeriodoCard: React.FC<{ 
    periodo: Periodo; 
    onAdelantar: (id: number) => void; 
}> = ({ periodo, onAdelantar }) => {
  const [showMaterias, setShowMaterias] = useState(false);
  
  // --- LÓGICA DE ESTADOS Y FECHAS ---
  const now = new Date();
  const inicio = new Date(periodo.fecha_inicio_encuesta);
  const finEncuesta = new Date(periodo.fecha_fin_encuesta);
  const finInforme = periodo.fecha_limite_informe ? new Date(periodo.fecha_limite_informe) : null;
  const finSintetico = periodo.fecha_limite_sintetico ? new Date(periodo.fecha_limite_sintetico) : null;
  
  // Calculamos el final absoluto del ciclo para determinar si está "En Curso"
  const fechasCierre = [finEncuesta, finInforme, finSintetico].filter((d): d is Date => d !== null);
  const finAbsoluto = fechasCierre.length > 0 
      ? new Date(Math.max(...fechasCierre.map(d => d.getTime()))) 
      : inicio;

  // --- DETERMINAR ETAPA ACTIVA (Para pintar la barra azul) ---
  const isEncuestaActiva = now >= inicio && now <= finEncuesta;
  const isInformeActivo = finInforme && now > finEncuesta && now <= finInforme;
  const isSinteticoActivo = finSintetico && finInforme && now > finInforme && now <= finSintetico;

  // --- ESTILOS VISUALES GENERALES DE LA TARJETA ---
  let estadoLabel = "Finalizado";
  let badgeStyle = "bg-gray-200 text-gray-600 border-gray-300";
  let cardBorderClass = "border-gray-200"; 
  let headerBgClass = "bg-gray-100";       
  let esAdelantable = false;

  if (now < inicio) {
      estadoLabel = "En Espera";
      badgeStyle = "bg-yellow-100 text-yellow-800 border-yellow-200";
      cardBorderClass = "border-yellow-300 ring-1 ring-yellow-100";
      headerBgClass = "bg-yellow-50";
      esAdelantable = false;
  } else if (now <= finAbsoluto) {
      estadoLabel = "En Curso";
      badgeStyle = "bg-green-100 text-green-700 border-green-200";
      cardBorderClass = "border-green-500 ring-2 ring-green-100 shadow-md";
      headerBgClass = "bg-green-50";
      esAdelantable = true;
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden mb-6 transition-all hover:shadow-md ${cardBorderClass}`}>
      
      {/* Encabezado */}
      <div className={`${headerBgClass} px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4`}>
        <div>
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-3">
            {periodo.nombre}
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}
            >
              {estadoLabel}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Creado: ID #{periodo.id} • Total materias:{" "}
            {periodo.encuestas.length}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            {esAdelantable && (
                <button
                    onClick={() => onAdelantar(periodo.id)}
                    className="bg-white hover:bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Adelantar Plazo
                </button>
            )}
            
            <button
            onClick={() => setShowMaterias(!showMaterias)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
            {showMaterias ? "Ocultar Materias" : "Ver Materias"}
            <svg
                className={`w-4 h-4 transition-transform ${
                showMaterias ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
                />
            </svg>
            </button>
        </div>
      </div>

      {/* Grid de Plazos con Barras Activas */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        
        {/* Columna 1: Encuestas */}
        <div className={`flex flex-col space-y-3 border-l-4 pl-4 transition-colors duration-300 ${isEncuestaActiva ? "border-blue-500 bg-blue-50/10 rounded-r-lg" : "border-gray-300"}`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${isEncuestaActiva ? "text-blue-600" : "text-gray-400"}`}>
            Encuestas Alumnos
          </span>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Apertura</p>
            <p className="font-semibold text-gray-800">
              {formatDate(periodo.fecha_inicio_encuesta)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Cierre Automático</p>
            <p className="font-bold text-gray-900">
              {formatDate(periodo.fecha_fin_encuesta)}
            </p>
          </div>
        </div>

        {/* Columna 2: Informes */}
        <div className={`flex flex-col space-y-3 border-l-4 pl-4 transition-colors duration-300 ${isInformeActivo ? "border-blue-500 bg-blue-50/10 rounded-r-lg" : "border-gray-300"}`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${isInformeActivo ? "text-blue-600" : "text-gray-400"}`}>
            Informes de Cátedra
          </span>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Vencimiento</p>
            {periodo.fecha_limite_informe ? (
              <p className="font-bold text-gray-900">
                {formatDate(periodo.fecha_limite_informe)}
              </p>
            ) : (
              <p className="text-gray-400 italic">Sin límite definido</p>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Habilitado tras cierre de encuesta.
          </p>
        </div>

        {/* Columna 3: Sintéticos */}
        <div className={`flex flex-col space-y-3 border-l-4 pl-4 transition-colors duration-300 ${isSinteticoActivo ? "border-blue-500 bg-blue-50/10 rounded-r-lg" : "border-gray-300"}`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${isSinteticoActivo ? "text-blue-600" : "text-gray-400"}`}>
            Informe Sintético
          </span>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">
              Generación Automática
            </p>
            {periodo.fecha_limite_sintetico ? (
              <p className="font-bold text-gray-900">
                {formatDate(periodo.fecha_limite_sintetico)}
              </p>
            ) : (
              <p className="text-gray-400 italic">Sin límite definido</p>
            )}
          </div>
          <p className="text-xs text-gray-400">Agrupa informes por Dpto.</p>
        </div>
      </div>

      {/* Lista Desplegable de Materias */}
      {showMaterias && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 animate-fadeIn">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Materias Incluidas
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {periodo.encuestas.map((enc) => (
              <div
                key={enc.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-xs"
              >
                <span className="text-gray-700 font-medium truncate pr-2" title={enc.cursada.materia.nombre}>
                  {enc.cursada.materia.nombre}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    enc.estado === "activa"
                      ? "bg-green-100 text-green-800"
                      : enc.estado === "cerrada"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {enc.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const VerCicloVida: React.FC = () => {
  const { token } = useAuth();
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales de confirmación
  const [targetPeriodId, setTargetPeriodId] = useState<number | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmTextModal, setShowConfirmTextModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchPeriodos = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/admin/gestion-encuestas/periodos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setPeriodos(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    fetchPeriodos();
  }, [token]);

  // --- LÓGICA DE ORDENAMIENTO ---
  const sortedPeriodos = useMemo(() => {
    const now = new Date();
    return [...periodos].sort((a, b) => {
        // Función helper para determinar prioridad
        const getPriority = (p: Periodo) => {
            const inicio = new Date(p.fecha_inicio_encuesta);
            const fechas = [p.fecha_fin_encuesta, p.fecha_limite_informe, p.fecha_limite_sintetico]
                .filter(Boolean).map(d => new Date(d!));
            const finAbsoluto = fechas.length > 0 ? new Date(Math.max(...fechas.map(d => d.getTime()))) : inicio;

            if (now < inicio) return 1; // En Espera (Intermedio)
            if (now <= finAbsoluto) return 0; // En Curso (Máxima Prioridad - Arriba)
            return 2; // Finalizado (Fondo)
        };

        const prioA = getPriority(a);
        const prioB = getPriority(b);

        if (prioA !== prioB) return prioA - prioB;

        // Desempate por fecha de inicio (más reciente primero dentro de su categoría)
        return new Date(b.fecha_inicio_encuesta).getTime() - new Date(a.fecha_inicio_encuesta).getTime();
    });
  }, [periodos]);

  // Handlers
  const handleAdelantarClick = (id: number) => {
      setTargetPeriodId(id);
      setShowWarningModal(true);
  };

  const confirmWarning = () => {
      setShowWarningModal(false);
      setShowConfirmTextModal(true);
      setConfirmInput("");
  };

  const executeAdelantar = async () => {
      if (!targetPeriodId) return;
      setProcessing(true);
      try {
          const res = await fetch(`${API_BASE_URL}/admin/gestion-encuestas/periodo/${targetPeriodId}/adelantar`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.ok) {
              alert("Plazo adelantado correctamente.");
              fetchPeriodos(); 
          } else {
              const err = await res.json();
              alert(`Error: ${err.detail || "No se pudo adelantar"}`);
          }
      } catch (e) {
          console.error(e);
          alert("Error de conexión");
      } finally {
          setProcessing(false);
          setShowConfirmTextModal(false);
          setTargetPeriodId(null);
      }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Plazos Establecidos</h1>
            <p className="text-gray-500 mt-1">Consulta los cierres programados para cada ciclo.</p>
        </div>
        
        <Link 
            to="/secretaria/CicloVida" 
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Configurar Nuevo Ciclo
        </Link>
      </div>

      {sortedPeriodos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No hay ciclos de encuestas definidos aún.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {sortedPeriodos.map((periodo) => (
            <PeriodoCard 
                key={periodo.id} 
                periodo={periodo} 
                onAdelantar={handleAdelantarClick}
            />
          ))}
        </div>
      )}

      {/* --- MODAL 1: ADVERTENCIA --- */}
      {showWarningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                  <div className="flex items-center gap-3 text-amber-600 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-xl font-bold">¡Atención!</h3>
                  </div>
                  <p className="text-gray-700 mb-6">
                      Está a punto de terminar con el periodo actual y pasar a la siguiente fecha. 
                      Esto puede traer consecuencias en los resultados de las estadísticas. 
                      <br/><br/>
                      <strong>¿Está seguro que desea adelantar el periodo?</strong>
                  </p>
                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setShowWarningModal(false)}
                          className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                      >
                          No, cancelar
                      </button>
                      <button 
                          onClick={confirmWarning}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md transition-colors"
                      >
                          Sí, continuar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL 2: CONFIRMACIÓN TEXTUAL --- */}
      {showConfirmTextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Confirmación Requerida</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                      Para confirmar el adelanto del periodo escriba <strong>CONFIRMO</strong> en el siguiente campo:
                  </p>
                  
                  <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-3 text-center uppercase tracking-widest font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-6"
                      placeholder="CONFIRMO"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                  />

                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setShowConfirmTextModal(false)}
                          className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                          disabled={processing}
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={executeAdelantar}
                          disabled={confirmInput !== "CONFIRMO" || processing}
                          className={`px-4 py-2 font-bold rounded-lg shadow-md transition-colors ${
                              confirmInput === "CONFIRMO" && !processing
                                  ? "bg-red-600 hover:bg-red-700 text-white" 
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                      >
                          {processing ? "Procesando..." : "Confirmar Adelanto"}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default VerCicloVida;