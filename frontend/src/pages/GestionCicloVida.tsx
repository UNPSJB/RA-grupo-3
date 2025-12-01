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
  periodo: string;
  materia_ciclo: string;
}

// --- Helpers de Fechas ---

// Formatea la fecha local para el input datetime-local (YYYY-MM-DDThh:mm)
const toLocalISOString = (date: Date) => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Calcula las fechas por defecto al momento de llamar la función
const getDefaults = () => {
  const now = new Date();
  
  // 1. Apertura: Hora actual + 1 hora
  const apertura = new Date(now.getTime() + 60 * 60 * 1000);
  
  const set8AM = (d: Date) => {
      const newD = new Date(d); // Copia para no mutar
      newD.setHours(8, 0, 0, 0);
      return newD;
  };

  // 2. Cierre Encuestas: +14 días
  const cierreEnc = new Date(now);
  cierreEnc.setDate(cierreEnc.getDate() + 14);
  
  // 3. Cierre Informes: +30 días
  const cierreInf = new Date(now);
  cierreInf.setDate(cierreInf.getDate() + 30);
  
  // 4. Cierre Sintético: +45 días
  const cierreSin = new Date(now);
  cierreSin.setDate(cierreSin.getDate() + 45);

  return {
    apertura: toLocalISOString(apertura),
    cierreEnc: toLocalISOString(set8AM(cierreEnc)),
    cierreInf: toLocalISOString(set8AM(cierreInf)),
    cierreSin: toLocalISOString(set8AM(cierreSin)),
  };
};

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
        <div className="w-full bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3 text-left">
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
  
  // --- Configuración de Plantillas ---
  const [plantillaBasico, setPlantillaBasico] = useState("");
  const [plantillaSuperior, setPlantillaSuperior] = useState("");

  // --- Selector de Periodo Activo ---
  const [periodoActivoTab, setPeriodoActivoTab] = useState<"P1" | "P2">("P1");

  // --- INICIALIZACIÓN DE ESTADOS CON VALORES POR DEFECTO ---
  // Calculamos los defaults una sola vez al cargar el componente
  const initialDefaults = useMemo(() => getDefaults(), []);

  const [fechaInicioEncuestaP1, setFechaInicioEncuestaP1] = useState(initialDefaults.apertura);
  const [fechaFinEncuestaP1, setFechaFinEncuestaP1] = useState(initialDefaults.cierreEnc);
  const [fechaFinInformeP1, setFechaFinInformeP1] = useState(initialDefaults.cierreInf);
  const [fechaFinSinteticoP1, setFechaFinSinteticoP1] = useState(initialDefaults.cierreSin);

  const [fechaInicioEncuestaP2, setFechaInicioEncuestaP2] = useState(initialDefaults.apertura);
  const [fechaFinEncuestaP2, setFechaFinEncuestaP2] = useState(initialDefaults.cierreEnc);
  const [fechaFinInformeP2, setFechaFinInformeP2] = useState(initialDefaults.cierreInf);
  const [fechaFinSinteticoP2, setFechaFinSinteticoP2] = useState(initialDefaults.cierreSin);

  // --- Carga Inicial de Datos (API) ---
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

  // --- Cálculo de Impacto ---
  const resumenImpacto = useMemo(() => {
    const p1 = cursadas.filter(c => c.periodo === "primero");
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

  // Helper para validar fechas mínimas en inputs
  const getMinDate = (prevDate: string) => {
    if (!prevDate) return undefined;
    return prevDate; 
  };

  // --- VALIDACIÓN TOTAL ---
  const p1Requerido = resumenImpacto.p1.total > 0;
  const p1Completo = fechaInicioEncuestaP1 && fechaFinEncuestaP1;
  
  const p2Requerido = resumenImpacto.p2.total > 0;
  const p2Completo = fechaInicioEncuestaP2 && fechaFinEncuestaP2;

  const formValido = (!p1Requerido || p1Completo) && (!p2Requerido || p2Completo) && plantillaBasico && plantillaSuperior;

  // --- Submit Masivo ---
  const handleGuardarPlanificacion = async () => {
    if (!formValido) {
      setMessage({ type: "error", text: "Complete todas las fechas de los periodos que tienen materias asignadas." });
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

      if (p1Requerido) {
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
        const res1 = await fetch(`${API_BASE_URL}/admin/gestion-encuestas/activar-masivo`, { method: "POST", headers, body: JSON.stringify(payloadP1) });
        if (!res1.ok) throw new Error("Error activando 1º Cuatrimestre");
        successCount += resumenImpacto.p1.total;
      }

      if (p2Requerido) {
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
        const res2 = await fetch(`${API_BASE_URL}/admin/gestion-encuestas/activar-masivo`, { method: "POST", headers, body: JSON.stringify(payloadP2) });
        if (!res2.ok) throw new Error("Error activando 2º Cuatrimestre");
        successCount += resumenImpacto.p2.total;
      }

      setMessage({ 
          type: "success", 
          text: `¡Proceso completado! Se activaron ${successCount} encuestas exitosamente.` 
      });
      
      const resCursadas = await fetch(`${API_BASE_URL}/admin/gestion-encuestas/cursadas-disponibles`, { headers });
      if (resCursadas.ok) setCursadas(await resCursadas.json());

    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Error al procesar la activación." });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Spinner />;

  // Variables dinámicas
  const isP1 = periodoActivoTab === "P1";
  
  const currentInicio = isP1 ? fechaInicioEncuestaP1 : fechaInicioEncuestaP2;
  const setInicio = isP1 ? setFechaInicioEncuestaP1 : setFechaInicioEncuestaP2;
  
  const currentFin = isP1 ? fechaFinEncuestaP1 : fechaFinEncuestaP2;
  const setFin = isP1 ? setFechaFinEncuestaP1 : setFechaFinEncuestaP2;
  
  const currentInforme = isP1 ? fechaFinInformeP1 : fechaFinInformeP2;
  const setInforme = isP1 ? setFechaFinInformeP1 : setFechaFinInformeP2;
  
  const currentSintetico = isP1 ? fechaFinSinteticoP1 : fechaFinSinteticoP2;
  const setSintetico = isP1 ? setFechaFinSinteticoP1 : setFechaFinSinteticoP2;

  const tabP1Valido = !p1Requerido || (fechaInicioEncuestaP1 && fechaFinEncuestaP1);
  const tabP2Valido = !p2Requerido || (fechaInicioEncuestaP2 && fechaFinEncuestaP2);

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20">
      
      {message && (
        <div className={`p-4 mb-8 rounded-lg text-center font-medium shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* --- PASO 1: PLANTILLAS --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">1</span>
            Asignación de Instrumentos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100">
            <label className="block text-sm font-bold text-blue-800 mb-1">Ciclo Básico (1° y 2°)</label>
            <p className="text-xs text-blue-600 mb-3">
                Disponibles: {resumenImpacto.p1.basico.length + resumenImpacto.p2.basico.length}
            </p>
            <select
              className="w-full border border-blue-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={plantillaBasico} onChange={(e) => setPlantillaBasico(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {plantillas.filter((p) => p.titulo.toLowerCase().includes("encuesta")).map((p) => (
                  <option key={p.id} value={p.id}>{p.titulo}</option>
              ))}
            </select>
          </div>
          <div className="bg-purple-50/50 p-5 rounded-lg border border-purple-100">
            <label className="block text-sm font-bold text-purple-800 mb-1">Ciclo Superior (3°+)</label>
            <p className="text-xs text-purple-600 mb-3">
                Disponibles: {resumenImpacto.p1.superior.length + resumenImpacto.p2.superior.length}
            </p>
            <select className="w-full border border-purple-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              value={plantillaSuperior} onChange={(e) => setPlantillaSuperior(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {plantillas.filter((p) => p.titulo.toLowerCase().includes("encuesta")).map((p) => (
                  <option key={p.id} value={p.id}>{p.titulo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- PASO 2: PLAZOS --- */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 px-1">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">2</span>
                Definición de Plazos
            </h2>
            
            <div className="flex bg-gray-200 p-1 rounded-lg gap-1">
                <button 
                    onClick={() => setPeriodoActivoTab("P1")}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${isP1 ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    1º Cuatri ({resumenImpacto.p1.total})
                    {!tabP1Valido && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
                <button 
                    onClick={() => setPeriodoActivoTab("P2")}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${!isP1 ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    2º Cuatri/Anual ({resumenImpacto.p2.total})
                    {!tabP2Valido && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
            </div>
        </div>

        <div className="relative flex flex-col md:flex-row justify-between items-start gap-4 animate-fadeIn">
            
            {/* NODO 1: ENCUESTA */}
            <TimelineNode 
                title="Encuesta a Estudiantes" 
                icon={<ProfileIcon className="w-8 h-8" />} 
                colorClass="bg-blue-600"
                isActive={!!plantillaBasico && !!plantillaSuperior}
            >
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">INICIO ({periodoActivoTab})</label>
                    <input type="datetime-local" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={currentInicio} onChange={(e) => setInicio(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CIERRE ({periodoActivoTab})</label>
                    <input type="datetime-local" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    min={getMinDate(currentInicio)} value={currentFin} onChange={(e) => setFin(e.target.value)} />
                </div>
            </TimelineNode>

            {/* NODO 2: INFORME CÁTEDRA */}
            <TimelineNode 
                title="Informe de Cátedra" 
                icon={<ClipboardListIcon className="w-8 h-8" />} 
                colorClass="bg-indigo-600"
                isActive={!!currentFin}
            >
                <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-700 mb-2 text-center">Habilitado al cerrar encuesta.</div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">LÍMITE ENTREGA ({periodoActivoTab})</label>
                    <input type="datetime-local" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    min={getMinDate(currentFin)} value={currentInforme} onChange={(e) => setInforme(e.target.value)} disabled={!currentFin} />
                </div>
            </TimelineNode>

            {/* NODO 3: SINTÉTICO */}
            <TimelineNode 
                title="Informe Sintético" 
                icon={<ChartLineIcon className="w-8 h-8" />} 
                colorClass="bg-purple-600"
                isActive={!!currentInforme}
                isLast={true}
            >
                <div className="bg-purple-50 p-2 rounded text-xs text-purple-700 mb-2 text-center">Generación por Depto.</div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">LÍMITE GENERACIÓN ({periodoActivoTab})</label>
                    <input type="datetime-local" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    min={getMinDate(currentInforme)} value={currentSintetico} onChange={(e) => setSintetico(e.target.value)} disabled={!currentInforme} />
                </div>
            </TimelineNode>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-6 border-t border-gray-200 bg-gray-50/50 p-6 rounded-xl">
        <div className="mb-4 flex gap-4 text-sm text-gray-600">
            <span className={`flex items-center gap-1 ${p1Completo ? "text-green-600 font-bold" : ""}`}>
                {p1Completo ? "✓" : "○"} 1º Cuatrimestre ({resumenImpacto.p1.total})
            </span>
            <span className={`flex items-center gap-1 ${p2Completo ? "text-green-600 font-bold" : ""}`}>
                {p2Completo ? "✓" : "○"} 2º Cuatri/Anual ({resumenImpacto.p2.total})
            </span>
        </div>

        <button
          onClick={handleGuardarPlanificacion}
          disabled={processing || !formValido}
          className={`
            px-10 py-4 rounded-full font-bold text-lg shadow-lg transform transition-all flex items-center gap-3
            ${processing || !formValido
              ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:shadow-xl hover:ring-4 hover:ring-blue-200"}
          `}
        >
          {processing ? (
             <>
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               Procesando...
             </>
          ) : (
             <>
                <CheckIcon className="w-6 h-6 text-white" />
                Confirmar y Activar Calendario
             </>
          )}
        </button>
        {!formValido && (
           <p className="text-xs text-red-500 mt-3 font-medium animate-pulse">
              Falta definir fechas para los periodos activos o seleccionar plantillas.
           </p>
        )}
      </div>

    </div>
  );
};

export default GestionCicloVida;