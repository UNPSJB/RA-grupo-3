import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const SEDE_COORDS: Record<string, { lat: number, lon: number }> = {
  "Comodoro Rivadavia": { lat: -45.8641, lon: -67.4966 },
  "Trelew": { lat: -43.2490, lon: -65.3051 },
  "Puerto Madryn": { lat: -42.7692, lon: -65.0385 },
  "Esquel": { lat: -42.9167, lon: -71.3167 },
};

interface Sede {
  id: number;
  localidad: string;
}

// --- Widget de Reloj (Diseño en una sola línea) ---
const ServerClock: React.FC = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/system/time`)
      .then(res => res.json())
      .then(data => setTime(new Date(data.server_time)))
      .catch(err => console.error("Error hora server:", err));
  }, []);

  useEffect(() => {
    if (!time) return;
    const interval = setInterval(() => {
      setTime(prev => prev ? new Date(prev.getTime() + 1000) : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [time]);

  if (!time) return <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">Cargando...</div>;

  const hours = time.getHours() % 12 || 12;
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = time.getHours() >= 12 ? 'p.m.' : 'a.m.';
  
  const dateString = time.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-200 h-full w-full flex flex-col justify-center items-center relative overflow-hidden group hover:shadow-md transition-all">
      
      {/* Título posicionado igual que en el widget de clima */}
      <div className="absolute top-3 left-4 z-10">
         <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hora del Servidor</h3>
      </div>
      
      <div className="flex flex-col items-center justify-center h-full mt-4">
        {/* Bloque de Hora: Todo en una línea base */}
        <div className="flex items-baseline text-blue-600 leading-none">
          {/* Hora:Minutos */}
          <span className="text-6xl font-bold tracking-tighter">
            {hours}:{minutes}
          </span>
          
          {/* Segundos */}
          <span className="text-4xl font-semibold ml-1 text-blue-400">
            :{seconds}
          </span>
          
          {/* AM/PM */}
          <span className="text-2xl font-bold uppercase ml-2 text-blue-500">
            {ampm}
          </span>
        </div>
        
        {/* Fecha debajo */}
        <div className="text-sm text-gray-500 font-medium mt-2 capitalize">
          {dateString}
        </div>
      </div>
    </div>
  );
};

// --- Widget de Clima (Sin cambios, mantenemos el estilo anterior) ---
const WeatherWidget: React.FC = () => {
  const { token } = useAuth();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [selectedSede, setSelectedSede] = useState<string>("Comodoro Rivadavia");
  const [weather, setWeather] = useState<{ temp: number, condition: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/profesor/mis-sedes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then((data: Sede[]) => {
      setSedes(data);
      if (data.length > 0) setSelectedSede(data[0].localidad);
    })
    .catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    if (!selectedSede) return;
    const coords = SEDE_COORDS[selectedSede] || SEDE_COORDS["Comodoro Rivadavia"];
    setLoading(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`)
      .then(res => res.json())
      .then(data => {
        if (data.current_weather) {
            setWeather({
            temp: data.current_weather.temperature,
            condition: data.current_weather.weathercode
            });
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedSede]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️";
    if (code >= 1 && code <= 3) return "⛅";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71) return "❄️";
    if (code >= 95) return "⛈️";
    return "🌤️";
  };

  return (
    <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200 h-full w-full flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
      
      <div className="absolute top-3 left-4 z-10">
         <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clima Actual</h3>
      </div>

      <div className="flex flex-row items-center justify-end gap-3 flex-grow pr-2 mt-4">
         {loading ? (
            <span className="text-xs text-gray-400 animate-pulse">Cargando...</span>
         ) : weather ? (
            <>
              <div className="text-6xl drop-shadow-md transform -translate-y-1">{getWeatherIcon(weather.condition)}</div>
              <div className="flex flex-col items-start">
                 <div className="text-6xl font-bold text-blue-600 leading-none">{Math.round(weather.temp)}°</div>
              </div>
            </>
         ) : (
            <span className="text-xs text-gray-400">--</span>
         )}
      </div>
      
      <div className="flex justify-end z-10 mt-1">
         {sedes.length > 1 ? (
            <select 
              value={selectedSede} 
              onChange={(e) => setSelectedSede(e.target.value)}
              className="text-[10px] border-none bg-blue-50 text-blue-700 font-bold rounded-md focus:ring-0 cursor-pointer hover:bg-blue-100 py-1 px-2 w-auto max-w-full outline-none text-right appearance-none"
            >
               {sedes.map(s => <option key={s.id} value={s.localidad}>{s.localidad}</option>)}
            </select>
         ) : (
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md truncate max-w-[150px]">
              {selectedSede}
            </span>
         )}
      </div>
      
      <div className="absolute -bottom-4 -left-4 opacity-5 text-8xl pointer-events-none select-none rotate-12">
         🌡️
      </div>
    </div>
  );
};

// --- Layout ---
const DashboardWidgets: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[57rem] mx-auto mb-6">
       <div className="h-32 w-full">
          <ServerClock />
       </div>
       <div className="h-32 w-full">
          <WeatherWidget />
       </div>
    </div>
  );
};

export default DashboardWidgets;