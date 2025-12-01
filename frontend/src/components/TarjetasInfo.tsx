import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface DashboardItem {
  materia_id: number;
  materia_nombre: string;
  cantidad_inscriptos: number;
  cantidad_respuestas: number;
  fecha_fin: string | null; // Cierre Encuesta
  fecha_limite_informe: string | null; // Cierre Reporte (Nuevo)
  estado: string;
  periodo: string;
}

// ... (DonutChart se mantiene igual) ...
const DonutChart: React.FC<{ value: number; total: number }> = ({ value, total }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const size = 140; 
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (value / total || 0));
  const color = percentage < 30 ? "text-red-500" : percentage < 70 ? "text-yellow-500" : "text-green-500";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center my-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
        <circle className="text-gray-200" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={center} cy={center} />
        <circle className={`${color} transition-all duration-1000 ease-out`} stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" r={radius} cx={center} cy={center} />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-bold text-gray-800">{percentage}%</span>
        <p className="text-xs text-gray-500 font-medium">{value}/{total}</p>
      </div>
    </div>
  );
};

// --- COMPONENTE ACTUALIZADO: TimeLeftCard ---
const TimeLeftCard: React.FC<{ 
    endDateStr: string | null, // Fin Encuesta
    reportDateStr: string | null, // Fin Reporte
    estado: string 
}> = ({ endDateStr, reportDateStr, estado }) => {
  
  // Helpers para formatear fecha corta (dd/mm)
  const formatDate = (dateStr: string | null) => {
      if (!dateStr) return "-";
      return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  };

  // Cálculo de días restantes (usamos la fecha de reporte si la encuesta ya cerró, o la de encuesta si está activa)
  const getDaysLeft = () => {
      const targetDateStr = estado === "activa" ? endDateStr : reportDateStr;
      if (!targetDateStr) return null;
      
      const end = new Date(targetDateStr);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const days = getDaysLeft();
  const daysDisplay = days !== null ? (days < 0 ? "0" : days) : "∞";
  
  // Mensaje dinámico
  let mainLabel = "Días Restantes";
  if (estado === "activa") mainLabel = "Cierre Encuestas en";
  else if (estado === "cerrada" && days !== null && days > 0) mainLabel = "Cierre Reportes en";
  else if (estado === "cerrada") mainLabel = "Plazos Finalizados";

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between h-full w-full">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Plazos & Vencimientos</h3>
      
      <div className="flex flex-col items-center my-2">
          <span className="text-5xl font-bold text-indigo-600 leading-none">{daysDisplay}</span>
          <span className="text-xs text-gray-500 font-medium mt-1">{days === 1 ? "Día" : "Días"}</span>
          <span className="text-[10px] text-indigo-400 font-bold uppercase mt-1">{mainLabel}</span>
      </div>

      <div className="space-y-2 w-full mt-2">
          <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-1">
              <span className="text-gray-500">Cierre Alumnos</span>
              <span className={`font-semibold ${estado === 'activa' ? 'text-green-600' : 'text-gray-700'}`}>
                  {formatDate(endDateStr)}
              </span>
          </div>
          <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Límite Reporte</span>
              <span className={`font-semibold ${estado === 'cerrada' ? 'text-blue-600' : 'text-gray-700'}`}>
                  {formatDate(reportDateStr)}
              </span>
          </div>
      </div>
    </div>
  );
};

// ... (CompletionCard y SubjectListCard se mantienen igual) ...
const CompletionCard: React.FC<{ item: DashboardItem }> = ({ item }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center h-full w-full">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center px-2 truncate w-full mb-2">
        {item.materia_nombre}
      </h3>
      <DonutChart value={item.cantidad_respuestas} total={item.cantidad_inscriptos} />
      <div className={`px-4 py-1 rounded-full text-[10px] font-bold tracking-wide ${item.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {item.estado.toUpperCase()}
      </div>
    </div>
  );
};

const SubjectListCard: React.FC<{ items: DashboardItem[], selectedId: number | null, onSelect: (id: number) => void }> = ({ items, selectedId, onSelect }) => {
  
  // Separamos las materias en dos grupos
  const itemsP1 = items.filter(i => i.periodo === 'primero');
  const itemsP2 = items.filter(i => i.periodo === 'segundo' || i.periodo === 'anual');

  // Función auxiliar para renderizar cada botón (para no repetir código)
  const renderItem = (item: DashboardItem) => (
    <button
      key={item.materia_id}
      onClick={() => onSelect(item.materia_id)}
      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex justify-between items-center text-sm ${
        selectedId === item.materia_id
          ? "bg-indigo-600 text-white shadow-md font-medium"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span className="truncate pr-2 w-full">{item.materia_nombre}</span>
      {selectedId === item.materia_id && <span className="text-indigo-200 text-[10px] transform scale-150">●</span>}
    </button>
  );

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full w-full flex flex-col">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-4">
        Materias ({new Date().getFullYear()})
      </h3>
      
      <div className="flex-grow overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        
        {/* SECCIÓN 1º CUATRIMESTRE */}
        {itemsP1.length > 0 && (
            <div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 px-1 border-b border-gray-100 pb-1">
                    1º Cuatrimestre
                </div>
                <div className="space-y-2">
                    {itemsP1.map(renderItem)}
                </div>
            </div>
        )}

        {/* SECCIÓN 2º CUATRIMESTRE / ANUAL */}
        {itemsP2.length > 0 && (
            <div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 px-1 border-b border-gray-100 pb-1">
                    2º Cuatrimestre / Anual
                </div>
                <div className="space-y-2">
                    {itemsP2.map(renderItem)}
                </div>
            </div>
        )}

        {items.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">No tienes materias asignadas.</p>
        )}

      </div>
    </div>
  );
};

export default function TarjetasInfo() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/encuestas-abiertas/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(json => { setData(json); if (json.length > 0) setSelectedId(json[0].materia_id); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const selectedItem = useMemo(() => data.find(d => d.materia_id === selectedId) || null, [data, selectedId]);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando dashboard...</div>;
  if (data.length === 0) return <div className="p-8 text-center bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">No hay periodos de encuestas disponibles.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      
      <div className="w-full h-80">
         {selectedItem && (
             <TimeLeftCard 
                endDateStr={selectedItem.fecha_fin} 
                reportDateStr={selectedItem.fecha_limite_informe} // Pasamos la nueva fecha
                estado={selectedItem.estado} 
             />
         )}
      </div>

      <div className="w-full h-80">
          {selectedItem && <CompletionCard item={selectedItem} />}
      </div>

      <div className="w-full h-80">
          <SubjectListCard items={data} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

    </div>
  );
}