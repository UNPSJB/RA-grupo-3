import React, { useState, useEffect, useMemo } from "react";
import CursadaResultados from "../components/estadisticas/CursadaResultados";
import type { ResultadoCursada } from "../types/estadisticas";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Generador de años
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i).reverse();

// Interface simple para las materias del selector
interface MateriaSimple {
  id: number;
  nombre: string;
}

const ResultadosProfesorPage: React.FC = () => {
  const [resultados, setResultados] = useState<ResultadoCursada[]>([]);
  const [materiasList, setMateriasList] = useState<MateriaSimple[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCursadaId, setSelectedCursadaId] = useState<number | null>(null);
  
  // --- FILTROS ---
  const [selectedYear, setSelectedYear] = useState<string>(""); 
  const [selectedMateria, setSelectedMateria] = useState<string>(""); // ID como string
  
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  // 1. Cargar lista de materias disponibles para el profesor
  useEffect(() => {
    if (!token) return;
    
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

  // 2. Cargar resultados con filtros
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
        // Construcción dinámica de URL con query params
        const params = new URLSearchParams();
        if (selectedYear) params.append("anio", selectedYear);
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
    
  }, [token, logout, selectedYear, selectedMateria]); // Se ejecuta cuando cambia cualquier filtro

  const selectedResultado = useMemo(() => {
    if (!selectedCursadaId) return null;
    return resultados.find((r) => r.cursada_id === selectedCursadaId) || null;
  }, [selectedCursadaId, resultados]);

  // --- RENDER ---

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
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Mis Resultados</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Filtro Materia */}
          <div className="flex items-center gap-2">
            <label htmlFor="materia-select" className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Materia:
            </label>
            <select
              id="materia-select"
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
              className="w-full sm:w-48 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Todas las materias</option>
              {materiasList.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Año */}
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Año:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full sm:w-32 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Todos</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ESTADO DE CARGA / ERROR */}
      {loading && (
         <div className="text-center py-10 text-gray-500 animate-pulse">
           <p>Cargando resultados...</p>
         </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-center">
          <p>{error}</p>
        </div>
      )}

      {/* LISTA DE RESULTADOS */}
      {!loading && !error && resultados.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 border-dashed">
          <p className="text-lg font-medium text-gray-900 mt-2">Sin resultados</p>
          <p className="text-sm text-gray-500">
             No se encontraron encuestas con los filtros seleccionados.
          </p>
        </div>
      )}

      {!loading && !error && resultados.length > 0 && (
        <div className="grid gap-4">
          {resultados.map((enc) => (
            <div
              key={enc.cursada_id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center"
            >
              <div className="mb-3 sm:mb-0">
                <h3 className="text-lg font-bold text-indigo-700">
                  {enc.materia_nombre || "Sin Título"}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
                    {enc.cuatrimestre_info || "N/A"}
                  </span>
                  <span>•</span>
                  <span>{enc.cantidad_respuestas} respuestas</span>
                  {enc.fecha_cierre && (
                    <>
                      <span>•</span>
                      <span className="text-gray-400 text-xs">
                         Cerrada: {new Date(enc.fecha_cierre).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <button
                className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-colors w-full sm:w-auto text-center"
                onClick={() => setSelectedCursadaId(enc.cursada_id)}
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