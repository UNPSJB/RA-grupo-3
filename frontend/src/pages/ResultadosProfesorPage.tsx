import React, { useState, useEffect, useMemo } from "react";
import CursadaResultados from "../components/estadisticas/CursadaResultados";
import type { ResultadoCursada } from "../types/estadisticas";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Generamos los últimos 5 años (descendente) para el filtro
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // Ej: [2025, 2024, 2023, 2022, 2021]

// Interface simple para las materias del selector
interface MateriaSimple {
  id: number;
  nombre: string;
}

const ResultadosProfesorPage: React.FC = () => {
  // --- 1. INICIALIZACIÓN CON AÑO ACTUAL ---
  // Al iniciar con el año actual, el useEffect filtrará automáticamente al cargar la página.
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  // ----------------------------------------

  const [selectedMateria, setSelectedMateria] = useState<string>("");
  const [resultados, setResultados] = useState<ResultadoCursada[]>([]);
  const [materiasList, setMateriasList] = useState<MateriaSimple[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCursadaId, setSelectedCursadaId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { token, logout } = useAuth();

  // 1. Cargar lista de materias del profesor (para el filtro)
  useEffect(() => {
    if (!token) return;
    
    // Función auxiliar para cargar materias
    const fetchMaterias = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profesor/mis-materias`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setMateriasList(await res.json());
        }
      } catch (e) {
        console.error("Error cargando materias:", e);
      }
    };
    fetchMaterias();
  }, [token]);

  // 2. Cargar Resultados (se ejecuta al inicio y cuando cambian los filtros)
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Necesitas iniciar sesión para ver tus resultados.");
      return;
    }

    const fetchResultados = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        // Si hay un año seleccionado, lo agregamos a la URL
        if (selectedYear) params.append("anio", selectedYear);
        // Si hay una materia seleccionada, la agregamos a la URL
        if (selectedMateria) params.append("materia_id", selectedMateria);

        const url = `${API_BASE_URL}/profesor/mis-resultados?${params.toString()}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("Tu sesión expiró.");
            logout();
            return;
          }
          throw new Error("No se pudieron cargar los resultados.");
        }
        const data: ResultadoCursada[] = await response.json();
        setResultados(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResultados();
    
  }, [token, logout, selectedYear, selectedMateria]);

  const selectedResultado = useMemo(() => {
    if (!selectedCursadaId) return null;
    return resultados.find((r) => r.cursada_id === selectedCursadaId) || null;
  }, [selectedCursadaId, resultados]);


  // --- VISTA DE DETALLE (Cuando se selecciona una encuesta específica) ---
  if (selectedResultado) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => setSelectedCursadaId(null)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          &larr; Volver al listado
        </button>
        
        <CursadaResultados resultado={selectedResultado} />

        {/* Botón para crear informe de cátedra si corresponde */}
        {selectedResultado.informe_curricular_instancia_id && (
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={() =>
                navigate(
                  `/profesores/reportes/instancia/${selectedResultado.informe_curricular_instancia_id}/responder`
                )
              }
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-150 ease-in-out shadow-md"
            >
              Crear Informe de Actividad Curricular
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- VISTA DE LISTADO (DASHBOARD) ---
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Header y Filtros */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Mis Resultados</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             {/* Filtro Materia */}
             <div className="flex items-center gap-2 w-full sm:w-auto">
               <label htmlFor="materia-select" className="text-sm font-medium text-gray-600 whitespace-nowrap">Materia:</label>
               <select
                  id="materia-select"
                  value={selectedMateria}
                  onChange={(e) => setSelectedMateria(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm flex-1 sm:w-48"
                  disabled={loading}
                >
                  <option value="">Todas las materias</option>
                  {materiasList.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
             </div>

              {/* Filtro Año */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="year-select" className="text-sm font-medium text-gray-600 whitespace-nowrap">Año:</label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm w-full sm:w-32 font-medium"
                  disabled={loading}
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                  <option value="">Histórico</option>
                </select>
              </div>
          </div>
        </div>
        
        {/* Mensaje informativo del filtro activo */}
        <p className="text-sm text-gray-500 border-t border-gray-100 pt-3">
           {selectedYear 
             ? <>Mostrando encuestas del ciclo lectivo <strong>{selectedYear}</strong>.</>
             : <>Mostrando <strong>todo el historial</strong> de encuestas.</>
           }
        </p>
      </div>

      {/* Estado de Carga */}
      {loading && (
         <div className="text-center py-10 text-gray-500 animate-pulse">
           <p>Cargando resultados...</p>
         </div>
      )}

      {/* Estado de Error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-center">
          <p>{error}</p>
        </div>
      )}

      {/* Sin Resultados */}
      {!loading && !error && resultados.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-lg font-medium text-gray-700">No se encontraron resultados</p>
          <p className="text-sm text-gray-500 mt-2">
             {selectedYear 
               ? "No hay encuestas cerradas para los filtros seleccionados en este año."
               : "No tienes encuestas cerradas registradas."}
          </p>
        </div>
      )}

      {/* Lista de Tarjetas */}
      {!loading && !error && resultados.length > 0 && (
        <div className="grid gap-4">
          {resultados.map((enc) => (
            <div key={enc.cursada_id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-indigo-700">{enc.materia_nombre}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1 items-center">
                   <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                     {enc.cuatrimestre_info}
                   </span>
                   <span className="flex items-center gap-1">
                     <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                     {enc.cantidad_respuestas} respuestas
                   </span>
                   {enc.fecha_cierre && (
                     <span className="text-gray-400 text-xs border-l pl-3 border-gray-300">
                       Cerrada: {new Date(enc.fecha_cierre).toLocaleDateString()}
                     </span>
                   )}
                </div>
              </div>
              
              <button
                onClick={() => setSelectedCursadaId(enc.cursada_id)}
                className="px-5 py-2 text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 font-medium transition-colors w-full sm:w-auto"
              >
                Ver Resultados
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultadosProfesorPage;