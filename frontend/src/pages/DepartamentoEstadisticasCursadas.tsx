// frontend/src/pages/DepartamentoEstadisticasCursadas.tsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import type { ResultadoCursada } from "../types/estadisticas";
import Spinner from "../components/Spinner";
import CursadaResultados from "../components/estadisticas/CursadaResultados";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Interfaces para los selectores
interface Profesor {
  id: number;
  nombre: string;
}
interface Materia {
  id: number;
  nombre: string;
}

const DepartamentoEstadisticasCursadas: React.FC = () => {
  const { token, logout } = useAuth();

  // Estados para los selectores
  const [profesoresList, setProfesoresList] = useState<Profesor[]>([]);
  const [materiasList, setMateriasList] = useState<Materia[]>([]);

  // Estados para los datos
  const [selectedProfesor, setSelectedProfesor] = useState<string>("");
  const [selectedMateria, setSelectedMateria] = useState<string>("");
  const [resultados, setResultados] = useState<ResultadoCursada[]>([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar los selectores al inicio
  useEffect(() => {
    if (!token) return;
    
    const fetchSelectores = async () => {
      setLoading(true);
      try {
        const [profRes, matRes] = await Promise.all([
          fetch(`${API_BASE_URL}/departamento/profesores`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/departamento/materias`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (profRes.ok) {
          const data: Profesor[] = await profRes.json();
          setProfesoresList(data);
        }
        if (matRes.ok) {
          const data: Materia[] = await matRes.json();
          setMateriasList(data);
        }
      } catch (err) {
        setError("Error al cargar listas de profesores o materias.");
      } finally {
        setLoading(false);
      }
    };
    fetchSelectores();
  }, [token, logout]);

  // Handler para buscar estadísticas
  const fetchEstadisticas = async (tipo: 'profesor' | 'materia', id: string) => {
    if (!id || !token) return;

    setLoading(true);
    setError(null);
    setResultados([]); // Limpiar resultados anteriores
    
    let url = "";
    if (tipo === 'profesor') {
      url = `${API_BASE_URL}/departamento/estadisticas/profesor/${id}`;
    } else {
      url = `${API_BASE_URL}/departamento/estadisticas/materia/${id}`;
    }

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "No se pudieron cargar los resultados");
      }
      
      const data: ResultadoCursada[] = await response.json();
      setResultados(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Handlers para los <select>
  const handleProfesorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profId = e.target.value;
    setSelectedProfesor(profId);
    setSelectedMateria(""); // Limpiar la otra selección
    if (profId) {
      fetchEstadisticas('profesor', profId);
    } else {
      setResultados([]); // Limpiar si selecciona "ninguno"
    }
  };

  const handleMateriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matId = e.target.value;
    setSelectedMateria(matId);
    setSelectedProfesor(""); // Limpiar la otra selección
    if (matId) {
      fetchEstadisticas('materia', matId);
    } else {
      setResultados([]); // Limpiar si selecciona "ninguno"
    }
  };


  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Estadísticas de Cursadas
      </h1>
      
      {/* Contenedor de Selectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-lg shadow border">
        <div>
          <label htmlFor="profesor-select" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar por Profesor
          </label>
          <select
            id="profesor-select"
            value={selectedProfesor}
            onChange={handleProfesorChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            <option value="">-- Seleccione un profesor --</option>
            {profesoresList.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="materia-select" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar por Materia
          </label>
          <select
            id="materia-select"
            value={selectedMateria}
            onChange={handleMateriaChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            <option value="">-- Seleccione una materia --</option>
            {materiasList.map((mat) => (
              <option key={mat.id} value={mat.id}>
                {mat.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Área de Resultados */}
      <div>
        {loading && <Spinner />}
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-center">
            <p className="font-bold">¡Error!</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && resultados.length === 0 && (selectedProfesor || selectedMateria) && (
           <div className="text-center py-10 text-gray-600 bg-white p-8 rounded-lg shadow-md">
             <p className="text-lg font-semibold">No se encontraron resultados</p>
             <p className="text-base mt-2 text-gray-500">
               No hay encuestas cerradas para la selección actual.
             </p>
           </div>
        )}

        {!loading && !error && resultados.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-700">
              Mostrando {resultados.length} resultado(s)
            </h2>
            {/* ¡Aquí reutilizamos el componente! */}
            {resultados.map((resultado) => (
              <CursadaResultados key={resultado.cursada_id} resultado={resultado} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default DepartamentoEstadisticasCursadas;