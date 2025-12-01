import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";
import { 
  CheckIcon, 
  ProfileIcon, 
  ClipboardListIcon, 
  ChartLineIcon 
} from "../components/icons"; 

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- Interfaces ---
interface Plantilla {
  id: number;
  titulo: string;
}

interface Cursada {
  id: number;
  materia_nombre: string;
  profesor_nombre: string;
  anio: number;
  periodo: string; // "primero", "segundo", "anual"
  materia_ciclo: string;
}

// --- Componente Visual del Nodo de Tiempo ---
interface TimelineNodeProps {
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  isActive: boolean;
  children: React.ReactNode;
  isLast?: boolean;
}

const TimelineNode: React.FC<TimelineNodeProps> = ({ 
  title, 
  icon, 
  colorClass, 
  isActive, 
  children,
  isLast = false 
}) => {
  return (
    <div className={`relative flex-1 ${isActive ? "opacity-100" : "opacity-60 grayscale transition-all hover:grayscale-0 hover:opacity-100"}`}>
      {/* Línea conectora */}
      {!isLast && (
        <div className="absolute top-8 left-1/2 w-full h-1 bg-gray-200 -z-10 transform translate-x-1/2"></div>
      )}
      
      <div className="flex flex-col items-center text-center p-4">
        {/* Icono Circular */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg mb-4 ${colorClass} z-10 ring-4 ring-white`}>
          <div className="w-8 h-8">{icon}</div>
        </div>
        
        {/* Título */}
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        
        {/* Contenido (Inputs de fecha) */}
        <div className="w-full bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
};

const GestionCicloVida: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- Datos ---
  const [cursadas, setCursadas] = useState<Cursada[]>([]);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  
  // --- Configuración de Plantillas (Globales para ambos periodos) ---
  const [plantillaBasico, setPlantillaBasico] = useState("");
  const [plantillaSuperior, setPlantillaSuperior] = useState("");

  // --- Selector de Periodo Activo para Configurar ---
  const [periodoActivoTab, setPeriodoActivoTab] = useState<"P1" | "P2">("P1");

  // --- Configuración de Fechas: PERIODO 1 (1º Cuatrimestre) ---
  const [fechaInicioEncuestaP1, setFechaInicioEncuestaP1] = useState("");
  const [fechaFinEncuestaP1, setFechaFinEncuestaP1] = useState("");
  const [fechaFinInformeP1, setFechaFinInformeP1] = useState("");
  const [fechaFinSinteticoP1, setFechaFinSinteticoP1] = useState("");

  // --- Configuración de Fechas: PERIODO 2 (2º Cuatrimestre + Anuales) ---
  const [fechaInicioEncuestaP2, setFechaInicioEncuestaP2] = useState("");
  const [fechaFinEncuestaP2, setFechaFinEncuestaP2] = useState("");
  const [fechaFinInformeP2, setFechaFinInformeP2] = useState("");
  const [fechaFinSinteticoP2, setFechaFinSinteticoP2] = useState("");

  // --- Carga Inicial ---
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [resPlantillas, resCursadas] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/instrumentos/publicadas`, { headers }),
          fetch(`${API_BASE_URL}/admin/gestion-encuestas/cursadas-disponibles`, { headers })
        ]);

        if (resPlantillas.ok) setPlantillas(await resPlantillas.json());
        if (resCursadas.ok) setCursadas(await resCursadas.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // --- Cálculo de Impacto por Periodo y Ciclo ---
  const resumenImpacto = useMemo(() => {
    // Grupo 1: 1º Cuatrimestre
    const p1 = cursadas.filter(c => c.periodo === "primero");
    // Grupo 2: 2º Cuatrimestre + Anuales
    const p2 = cursadas.filter(c => c.periodo === "segundo" || c.periodo === "anual");

    return {
      p1: {
        basico: p1.filter(c => c.materia_ciclo === "basico"),
        superior: p1.filter(c => c.materia_ciclo === "superior"),
        total: p1.length
      },
      p2: {
        basico: p2.filter(c => c.materia_ciclo === "basico"),
        superior: p2.filter(c => c.materia_ciclo === "superior"),
        total: p2.length
      }
    };
  }, [cursadas]);

  // --- Helpers para Fechas ---
  const getMinDate = (prevDate: string) => {
    if (!prevDate) return undefined;
    return prevDate.split("T")[0]; 
  };

  // --- Submit Masivo Inteligente ---
  const handleGuardarPlanificacion = async () => {
    // Validar configuración básica de plantillas
    if (!plantillaBasico || !plantillaSuperior) {
      setMessage({ type: "error", text: "Debe seleccionar las plantillas para Ciclo Básico y Superior." });
      return;
    }

    // Detectar qué se va a activar
    const activarP1 = fechaInicioEncuestaP1 && fechaFinEncuestaP1 && resumenImpacto.p1.total > 0;
    const activarP2 = fechaInicioEncuestaP2 && fechaFinEncuestaP2 && resumenImpacto.p2.total > 0;

    if (!activarP1 && !activarP2) {
      setMessage({ type: "error", text: "Configure las fechas de al menos un periodo con materias disponibles." });
      return;
    }

    setProcessing(true);
    setMessage(null);
    let successCount = 0;

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1. Activar Periodo 1 si corresponde
      if (activarP1) {
        const payloadP1 = {
          nombre_periodo: `Ciclo ${new Date().getFullYear()} - 1º Cuatrimestre`,
          fecha_inicio_encuesta: fechaInicioEncuestaP1,
          fecha_fin_encuesta: fechaFinEncuestaP1,
          fecha_limite_informe: fechaFinInformeP1 || null,
          fecha_limite_sintetico: fechaFinSinteticoP1 || null,
          plantilla_basico_id: parseInt(plantillaBasico),
          cursadas_basico_ids: resumenImpacto.p1.basico.map(c => c.id),
          plantilla_superior_id: parseInt(plantillaSuperior),
          cursadas_superior_ids: resumenImpacto.p1.superior.map(c => c.id)
        };

        const res1 = await fetch(`${API_BASE_URL}/admin/gestion-encuestas/activar-masivo`, {
          method: "POST", headers, body: JSON.stringify(payloadP1),
        });
        if (!res1.ok) throw new Error("Error activando 1º Cuatrimestre");
        successCount += resumenImpacto.p1.total;
      }

      // 2. Activar Periodo 2 si corresponde
      if (activarP2) {
        const payloadP2 = {
          nombre_periodo: `Ciclo ${new Date().getFullYear()} - 2º Cuatrimestre / Anual`,
          fecha_inicio_encuesta: fechaInicioEncuestaP2,
          fecha_fin_encuesta: fechaFinEncuestaP2,
          fecha_limite_informe: fechaFinInformeP2 || null,
          fecha_limite_sintetico: fechaFinSinteticoP2 || null,
          plantilla_basico_id: parseInt(plantillaBasico),
          cursadas_basico_ids: resumenImpacto.p2.basico.map(c => c.id),
          plantilla_superior_id: parseInt(plantillaSuperior),
          cursadas_superior_ids: resumenImpacto.p2.superior.map(c => c.id)
        };

        const res2 = await fetch(`${API_BASE_URL}/admin/gestion-encuestas/activar-masivo`, {
          method: "POST", headers, body: JSON.stringify(payloadP2),
        });
        if (!res2.ok) throw new Error("Error activando 2º Cuatrimestre");
        successCount += resumenImpacto.p2.total;
      }

      setMessage({ 
          type: "success", 
          text: `¡Proceso completado! Se activaron ${successCount} encuestas exitosamente.` 
      });
      
      // Recargar y limpiar
      const resCursadas = await fetch(`${API_BASE_URL}/admin/gestion-encuestas/cursadas-disponibles`, { headers });
      if (resCursadas.ok) setCursadas(await resCursadas.json());

      // Resetear fechas
      setFechaInicioEncuestaP1(""); setFechaFinEncuestaP1(""); setFechaFinInformeP1(""); setFechaFinSinteticoP1("");
      setFechaInicioEncuestaP2(""); setFechaFinEncuestaP2(""); setFechaFinInformeP2(""); setFechaFinSinteticoP2("");

    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Error al procesar la activación." });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Spinner />;

  const isP1 = periodoActivoTab === "P1";
  const currentResumen = isP1 ? resumenImpacto.p1 : resumenImpacto.p2;
  
  const currentInicio = isP1 ? fechaInicioEncuestaP1 : fechaInicioEncuestaP2;
  const setInicio = isP1 ? setFechaInicioEncuestaP1 : setFechaInicioEncuestaP2;
  
  const currentFin = isP1 ? fechaFinEncuestaP1 : fechaFinEncuestaP2;
  const setFin = isP1 ? setFechaFinEncuestaP1 : setFechaFinEncuestaP2;
  
  const currentInforme = isP1 ? fechaFinInformeP1 : fechaFinInformeP2;
  const setInforme = isP1 ? setFechaFinInformeP1 : setFechaFinInformeP2;
  
  const currentSintetico = isP1 ? fechaFinSinteticoP1 : fechaFinSinteticoP2;
  const setSintetico = isP1 ? setFechaFinSinteticoP1 : setFechaFinSinteticoP2;

  const validP1 = fechaInicioEncuestaP1 && fechaFinEncuestaP1;
  const validP2 = fechaInicioEncuestaP2 && fechaFinEncuestaP2;

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20">
      
      {message && (
        <div className={`p-4 mb-8 rounded-lg text-center font-medium shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* --- PASO 1: PLANTILLAS (COMÚN) --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">1</span>
            Asignación de Instrumentos (Global)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100">
            <label className="block text-sm font-bold text-blue-800 mb-1">
              Ciclo Básico (1° y 2° Año)
            </label>
            <p className="text-xs text-blue-600 mb-3">
                Total disponible: {resumenImpacto.p1.basico.length + resumenImpacto.p2.basico.length} materias.
            </p>
            <select
              className="w-full border border-blue-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={plantillaBasico}
              onChange={(e) => setPlantillaBasico(e.target.value)}
            >
              <option value="">-- Seleccionar Plantilla Básico --</option>
              {plantillas.filter((p) => p.titulo.toLowerCase().includes("encuesta")).map((p) => (
                  <option key={p.id} value={p.id}>{p.titulo}</option>
              ))}
            </select>
          </div>

          <div className="bg-purple-50/50 p-5 rounded-lg border border-purple-100">
            <label className="block text-sm font-bold text-purple-800 mb-1">
              Ciclo Superior (3° Año en adelante)
            </label>
            <p className="text-xs text-purple-600 mb-3">
                Total disponible: {resumenImpacto.p1.superior.length + resumenImpacto.p2.superior.length} materias.
            </p>
            <select
              className="w-full border border-purple-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              value={plantillaSuperior}
              onChange={(e) => setPlantillaSuperior(e.target.value)}
            >
              <option value="">-- Seleccionar Plantilla Superior --</option>
              {plantillas.filter((p) => p.titulo.toLowerCase().includes("encuesta")).map((p) => (
                  <option key={p.id} value={p.id}>{p.titulo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- PASO 2: DEFINICIÓN DE PLAZOS (POR PERIODO) --- */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 px-1">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">2</span>
                Definición de Plazos
            </h2>
            
            {/* TABS DE SELECCIÓN DE PERIODO */}
            <div className="flex bg-gray-200 p-1 rounded-lg">
                <button 
                    onClick={() => setPeriodoActivoTab("P1")}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${isP1 ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    1º Cuatrimestre ({resumenImpacto.p1.total})
                </button>
                <button 
                    onClick={() => setPeriodoActivoTab("P2")}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${!isP1 ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    2º Cuatrimestre y Anuales ({resumenImpacto.p2.total})
                </button>
            </div>
        </div>

        <div className="relative flex flex-col md:flex-row justify-between items-start gap-4 animate-fadeIn">
            {/* NODO 1: ENCUESTA ALUMNOS */}
            <TimelineNode 
                title="Encuesta a Estudiantes" 
                icon={<ProfileIcon className="w-8 h-8" />} 
                colorClass="bg-blue-600"
                isActive={!!plantillaBasico && !!plantillaSuperior}
            >
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Inicio ({periodoActivoTab})</label>
                    <input type="datetime-local" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={currentInicio} onChange={(e) => setInicio(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cierre ({periodoActivoTab})</label>
                    <input type="datetime-local" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    min={getMinDate(currentInicio)} value={currentFin} onChange={(e) => setFin(e.target.value)} />
                </div>
            </TimelineNode>

            {/* NODO 2: INFORME PROFESOR */}
            <TimelineNode 
                title="Informe de Cátedra" 
                icon={<ClipboardListIcon className="w-8 h-8" />} 
                colorClass="bg-indigo-600"
                isActive={!!currentFin}
            >
                <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-700 mb-2">Habilitado al cerrar encuesta.</div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Límite Entrega ({periodoActivoTab})</label>
                    <input type="datetime-local" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    min={getMinDate(currentFin)} value={currentInforme} onChange={(e) => setInforme(e.target.value)} disabled={!currentFin} />
                </div>
            </TimelineNode>

            {/* NODO 3: INFORME SINTÉTICO */}
            <TimelineNode 
                title="Informe Sintético" 
                icon={<ChartLineIcon className="w-8 h-8" />} 
                colorClass="bg-purple-600"
                isActive={!!currentInforme}
                isLast={true}
            >
                <div className="bg-purple-50 p-2 rounded text-xs text-purple-700 mb-2">Generación por Depto.</div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Límite Generación ({periodoActivoTab})</label>
                    <input type="datetime-local" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    min={getMinDate(currentInforme)} value={currentSintetico} onChange={(e) => setSintetico(e.target.value)} disabled={!currentInforme} />
                </div>
            </TimelineNode>
        </div>
      </div>

      {/* --- RESUMEN DE ACCIÓN --- */}
      <div className="flex flex-col items-center justify-center pt-6 border-t border-gray-200 bg-gray-50/50 p-6 rounded-xl">
        <div className="mb-4 flex gap-4 text-sm text-gray-600">
            <span className={`flex items-center gap-1 ${validP1 ? "text-green-600 font-bold" : ""}`}>
                {validP1 ? "✓" : "○"} 1º Cuatrimestre ({resumenImpacto.p1.total})
            </span>
            <span className={`flex items-center gap-1 ${validP2 ? "text-green-600 font-bold" : ""}`}>
                {validP2 ? "✓" : "○"} 2º Cuatrimestre/Anual ({resumenImpacto.p2.total})
            </span>
        </div>

        <button
          onClick={handleGuardarPlanificacion}
          disabled={processing || (!validP1 && !validP2) || !plantillaBasico || !plantillaSuperior}
          className={`
            px-10 py-4 rounded-full font-bold text-lg shadow-lg transform transition-all flex items-center gap-3
            ${processing || (!validP1 && !validP2)
              ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:shadow-xl hover:ring-4 hover:ring-blue-200"}
          `}
        >
          {processing ? (
             <>
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               Procesando activación...
             </>
          ) : (
             <>
                <CheckIcon className="w-6 h-6 text-white" />
                Confirmar y Activar Calendario
             </>
          )}
        </button>
      </div>

    </div>
  );
};

export default GestionCicloVida;