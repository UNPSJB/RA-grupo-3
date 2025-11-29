import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";
import { 
  CheckIcon, // <--- Agregado aquí
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
  
  // --- Configuración de Plantillas ---
  const [plantillaBasico, setPlantillaBasico] = useState("");
  const [plantillaSuperior, setPlantillaSuperior] = useState("");

  // --- Configuración de Fechas (Etapas) ---
  // ETAPA 1: Encuesta Alumnos
  const [fechaInicioEncuesta, setFechaInicioEncuesta] = useState("");
  const [fechaFinEncuesta, setFechaFinEncuesta] = useState("");

  // ETAPA 2: Informe Profesor
  const [fechaFinInforme, setFechaFinInforme] = useState("");

  // ETAPA 3: Informe Sintético
  const [fechaFinSintetico, setFechaFinSintetico] = useState("");

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

  // --- Cálculo de Impacto ---
  const resumenImpacto = useMemo(() => {
    const basico = cursadas.filter(c => c.materia_ciclo === "basico");
    const superior = cursadas.filter(c => c.materia_ciclo === "superior");
    return { basico, superior };
  }, [cursadas]);

  // --- Helpers para Fechas ---
  const getMinDate = (prevDate: string) => {
    if (!prevDate) return undefined;
    return prevDate.split("T")[0]; 
  };

  // --- Submit Masivo ---
  const handleGuardarPlanificacion = async () => {
    if (!plantillaBasico || !plantillaSuperior || !fechaInicioEncuesta) {
      setMessage({ type: "error", text: "Por favor selecciona las plantillas para ambos ciclos y la fecha de inicio." });
      return;
    }

    if (resumenImpacto.basico.length === 0 && resumenImpacto.superior.length === 0) {
        setMessage({ type: "error", text: "No hay cursadas disponibles para activar en este momento." });
        return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      // Preparamos las promesas de activación
      const activaciones = [];

      // 1. Activar Ciclo Básico
      for (const cursada of resumenImpacto.basico) {
        activaciones.push(
            activarEncuestaIndividual(cursada.id, parseInt(plantillaBasico))
        );
      }

      // 2. Activar Ciclo Superior
      for (const cursada of resumenImpacto.superior) {
        activaciones.push(
            activarEncuestaIndividual(cursada.id, parseInt(plantillaSuperior))
        );
      }

      // Ejecutar todo (En un caso real idealmente esto sería un solo endpoint batch en backend)
      await Promise.all(activaciones);

      // Simulación de guardado de fechas futuras (informes)
      console.log("Fechas futuras configuradas:", {
          cierre_informe_profesor: fechaFinInforme,
          cierre_informe_sintetico: fechaFinSintetico
      });

      setMessage({ 
          type: "success", 
          text: `¡Calendario Activado! Se generaron ${activaciones.length} encuestas (Básico: ${resumenImpacto.basico.length}, Superior: ${resumenImpacto.superior.length}).` 
      });
      
      // Recargar cursadas (deberían desaparecer de disponibles)
      const headers = { Authorization: `Bearer ${token}` };
      const resCursadas = await fetch(`${API_BASE_URL}/admin/gestion-encuestas/cursadas-disponibles`, { headers });
      if (resCursadas.ok) setCursadas(await resCursadas.json());

      // Reset inputs
      setFechaInicioEncuesta("");
      setFechaFinEncuesta("");
      setFechaFinInforme("");
      setFechaFinSintetico("");

    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Hubo un error al procesar algunas activaciones." });
    } finally {
      setProcessing(false);
    }
  };

  const activarEncuestaIndividual = async (cursadaId: number, plantillaId: number) => {
    const payload = {
        cursada_id: cursadaId,
        plantilla_id: plantillaId,
        fecha_inicio: fechaInicioEncuesta, 
        fecha_fin: fechaFinEncuesta ? fechaFinEncuesta : null,
        estado: "activa",
    };

    const res = await fetch(`${API_BASE_URL}/admin/gestion-encuestas/activar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Fallo cursada ${cursadaId}`);
    return res.json();
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto p-6 pb-20">
      

      {message && (
        <div className={`p-4 mb-8 rounded-lg text-center font-medium shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* --- CONFIGURACIÓN DE PLANTILLAS (GLOBAL) --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">1</span>
            Asignación de Instrumentos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ciclo Básico */}
          <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100">
            <label className="block text-sm font-bold text-blue-800 mb-1">
              Ciclo Básico (1° y 2° Año)
            </label>
            <p className="text-xs text-blue-600 mb-3">
                Se aplicará a {resumenImpacto.basico.length} materias detectadas (ej: Matemática, Física).
            </p>
            <select
              className="w-full border border-blue-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={plantillaBasico}
              onChange={(e) => setPlantillaBasico(e.target.value)}
            >
              <option value="">-- Seleccionar Plantilla Básico --</option>
              {plantillas
                .filter((p) => p.titulo.toLowerCase().includes("encuesta"))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.titulo}</option>
              ))}
            </select>
          </div>

          {/* Ciclo Superior */}
          <div className="bg-purple-50/50 p-5 rounded-lg border border-purple-100">
            <label className="block text-sm font-bold text-purple-800 mb-1">
              Ciclo Superior (3° Año en adelante)
            </label>
            <p className="text-xs text-purple-600 mb-3">
                Se aplicará a {resumenImpacto.superior.length} materias detectadas.
            </p>
            <select
              className="w-full border border-purple-200 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              value={plantillaSuperior}
              onChange={(e) => setPlantillaSuperior(e.target.value)}
            >
              <option value="">-- Seleccionar Plantilla Superior --</option>
              {plantillas
                .filter((p) => p.titulo.toLowerCase().includes("encuesta"))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.titulo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- LÍNEA DE TIEMPO (CANVAS) --- */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 px-1">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">2</span>
            Definición de Plazos
        </h2>
        <div className="relative flex flex-col md:flex-row justify-between items-start gap-4">
            
            {/* NODO 1: ENCUESTA ALUMNOS */}
            <TimelineNode 
            title="Encuesta a Estudiantes" 
            icon={<ProfileIcon className="w-8 h-8" />} 
            colorClass="bg-blue-600"
            isActive={!!plantillaBasico && !!plantillaSuperior}
            >
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Inicio</label>
                <input 
                type="datetime-local" 
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={fechaInicioEncuesta}
                onChange={(e) => setFechaInicioEncuesta(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cierre</label>
                <input 
                type="datetime-local" 
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                min={getMinDate(fechaInicioEncuesta)}
                value={fechaFinEncuesta}
                onChange={(e) => setFechaFinEncuesta(e.target.value)}
                />
            </div>
            </TimelineNode>

            {/* NODO 2: INFORME PROFESOR */}
            <TimelineNode 
            title="Informe de Cátedra" 
            icon={<ClipboardListIcon className="w-8 h-8" />} 
            colorClass="bg-indigo-600"
            isActive={!!fechaFinEncuesta}
            >
            <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-700 mb-2">
                Habilitado automáticamente al cerrar encuesta.
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Límite de Entrega</label>
                <input 
                type="datetime-local" 
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                min={getMinDate(fechaFinEncuesta)}
                value={fechaFinInforme}
                onChange={(e) => setFechaFinInforme(e.target.value)}
                disabled={!fechaFinEncuesta}
                />
            </div>
            </TimelineNode>

            {/* NODO 3: INFORME SINTÉTICO */}
            <TimelineNode 
            title="Informe Sintético" 
            icon={<ChartLineIcon className="w-8 h-8" />} 
            colorClass="bg-purple-600"
            isActive={!!fechaFinInforme}
            isLast={true}
            >
            <div className="bg-purple-50 p-2 rounded text-xs text-purple-700 mb-2">
                Generación por Depto.
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Límite Generación</label>
                <input 
                type="datetime-local" 
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                min={getMinDate(fechaFinInforme)}
                value={fechaFinSintetico}
                onChange={(e) => setFechaFinSintetico(e.target.value)}
                disabled={!fechaFinInforme}
                />
            </div>
            </TimelineNode>

        </div>
      </div>

      {/* --- ACCIÓN FINAL --- */}
      <div className="flex justify-center pt-6 border-t border-gray-200 bg-gray-50/50 p-6 rounded-xl">
        <button
          onClick={handleGuardarPlanificacion}
          disabled={processing || !fechaInicioEncuesta || !plantillaBasico || !plantillaSuperior}
          className={`
            px-10 py-4 rounded-full font-bold text-lg shadow-lg transform transition-all flex items-center gap-3
            ${processing || !fechaInicioEncuesta 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:shadow-xl hover:ring-4 hover:ring-blue-200"}
          `}
        >
          {processing ? (
             <>
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               Procesando {cursadas.length} materias...
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