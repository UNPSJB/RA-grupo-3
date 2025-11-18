import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface DashboardItem {
  materia_id: number;
  materia_nombre: string;
  cantidad_inscriptos: number;
  cantidad_respuestas: number;
  fecha_fin: string | null;
  estado: string;
}

// --- Componentes UI ---
// (El DonutChart se mantiene igual o puedes ajustar el tamaño si quieres)
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

const TimeLeftCard: React.FC<{ endDateStr: string | null, estado: string }> = ({ endDateStr, estado }) => {
  const [message, setMessage] = useState("");
  const [days, setDays] = useState<number | string>("-");

  useEffect(() => {
    if (estado === "cerrada") {
      setMessage("Finalizada");
      setDays("0"); return;
    }
    if (!endDateStr) {
       setMessage("Sin límite");
       setDays("∞"); return;
    }
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) { setMessage("Finalizó hace"); setDays(`${Math.abs(diffDays)}d`); } 
    else { setMessage(diffDays === 1 ? "Día restante" : "Días restantes"); setDays(diffDays); }
  }, [endDateStr, estado]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center h-full w-full">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Cierre de Encuestas</h3>
      <div className="text-7xl font-bold text-indigo-600 leading-none">{days}</div>
      <div className="text-sm text-gray-500 font-medium mt-3">{message}</div>
    </div>
  );
};

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
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full w-full flex flex-col">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-4">
        Materias ({new Date().getFullYear()})
      </h3>
      <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {items.map((item) => (
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
        ))}
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
  if (data.length === 0) return <div className="p-8 text-center bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">No hay datos.</div>;

  return (
    // --- LAYOUT GRID: 3 COLUMNAS ---
    // Esto asegura que ocupen el mismo ancho total que los widgets de arriba
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      
      <div className="w-full h-80">
         {selectedItem && <TimeLeftCard endDateStr={selectedItem.fecha_fin} estado={selectedItem.estado} />}
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