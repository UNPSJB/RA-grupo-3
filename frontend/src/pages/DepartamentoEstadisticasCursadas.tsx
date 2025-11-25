import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import type { ResultadoCursada } from "../types/estadisticas";
import Spinner from "../components/Spinner";
import CursadaResultados from "../components/estadisticas/CursadaResultados";
import { Button } from "../components/Button";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface ItemSelector {
  id: number;
  nombre: string;
}

// Iconos SVG
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

// --- SUB-COMPONENTE: ACORDEÓN INDIVIDUAL ---
const CursadaAccordionItem: React.FC<{
  resultado: ResultadoCursada;
  isSelected: boolean;
  onToggleSelection: (id: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}> = ({ resultado, isSelected, onToggleSelection, isOpen, onToggleOpen }) => {
  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 ${
        isOpen
          ? "border-blue-300 shadow-md ring-1 ring-blue-100"
          : "border-gray-200 hover:border-blue-200"
      }`}
    >
      {/* HEADER CLICKEABLE */}
      <div
        className="p-4 flex items-center gap-4 cursor-pointer select-none"
        onClick={onToggleOpen}
      >
        {/* Checkbox para Comparar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center h-full"
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(resultado.cursada_id)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
        </div>

        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {resultado.materia_nombre}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span>{resultado.cuatrimestre_info}</span>
                {resultado.fecha_cierre && (
                  <>
                    <span>•</span>
                    <span>
                      Cierre:{" "}
                      {new Date(resultado.fecha_cierre).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full w-fit border border-blue-100">
              {resultado.cantidad_respuestas} respuestas
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <ChevronDownIcon
            className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* BODY DESPLEGABLE */}
      {isOpen && (
        <div className="border-t border-gray-100 p-4 sm:p-6 bg-gray-50/30 animate-fadeIn">
          <CursadaResultados resultado={resultado} />
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTE: VISTA DE COMPARACIÓN ---
const ComparacionView: React.FC<{
  r1: ResultadoCursada;
  r2: ResultadoCursada;
  onClose: () => void;
}> = ({ r1, r2, onClose }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          Comparando Encuestas
        </h2>
        <Button onClick={onClose} variant="secondary">
          Cerrar Comparación
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Columna Izquierda */}
        <div className="space-y-2">
          <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-t-lg font-semibold border-b-2 border-blue-200 text-center">
            {r1.materia_nombre} ({r1.cuatrimestre_info})
          </div>
          <div className="bg-white rounded-b-lg shadow p-2">
            <CursadaResultados resultado={r1} />
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="space-y-2">
          <div className="bg-purple-50 text-purple-800 px-4 py-2 rounded-t-lg font-semibold border-b-2 border-purple-200 text-center">
            {r2.materia_nombre} ({r2.cuatrimestre_info})
          </div>
          <div className="bg-white rounded-b-lg shadow p-2">
            <CursadaResultados resultado={r2} />
          </div>
        </div>
      </div>
    </div>
  );
};

const DepartamentoEstadisticasCursadas: React.FC = () => {
  const { token, logout } = useAuth();

  // Listas para Selectores
  const [profesoresList, setProfesoresList] = useState<ItemSelector[]>([]);
  const [materiasList, setMateriasList] = useState<ItemSelector[]>([]);

  // Selección de Filtros
  const [selectedProfesor, setSelectedProfesor] = useState<string>("");
  const [selectedMateria, setSelectedMateria] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Datos
  const [resultadosRaw, setResultadosRaw] = useState<ResultadoCursada[]>([]); // Datos originales
  const [filteredResults, setFilteredResults] = useState<ResultadoCursada[]>(
    []
  ); // Datos filtrados por fecha

  // Estado UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado Acordeones y Comparación
  const [openItems, setOpenItems] = useState<number[]>([]); // IDs abiertos
  const [selectedIds, setSelectedIds] = useState<number[]>([]); // IDs seleccionados para comparar
  const [showComparison, setShowComparison] = useState(false);

  // Cargar selectores al inicio
  useEffect(() => {
    if (!token) return;
    const fetchSelectores = async () => {
      try {
        const [profRes, matRes] = await Promise.all([
          fetch(`${API_BASE_URL}/departamento/profesores`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/departamento/materias`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (profRes.ok) setProfesoresList(await profRes.json());
        if (matRes.ok) setMateriasList(await matRes.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchSelectores();
  }, [token]);

  // Fetch principal de estadísticas
  const fetchEstadisticas = async (
    tipo: "profesor" | "materia",
    id: string
  ) => {
    if (!id || !token) return;

    setLoading(true);
    setError(null);
    setResultadosRaw([]);
    setOpenItems([]);
    setSelectedIds([]);
    setShowComparison(false);

    const url =
      tipo === "profesor"
        ? `${API_BASE_URL}/departamento/estadisticas/profesor/${id}`
        : `${API_BASE_URL}/departamento/estadisticas/materia/${id}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 404) {
        setResultadosRaw([]);
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.detail || "No se pudieron cargar los resultados"
        );
      }

      const data: ResultadoCursada[] = await response.json();
      setResultadosRaw(data);
    } catch (err) {
      // Este bloque ahora solo se ejecutará para errores reales (500, conexión, etc)
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Efecto para filtrar localmente por fechas cuando cambian los inputs o los datos
  useEffect(() => {
    let filtrados = resultadosRaw;

    if (startDate) {
      const start = new Date(startDate).getTime();
      filtrados = filtrados.filter((r) => {
        if (!r.fecha_cierre) return false;
        return new Date(r.fecha_cierre).getTime() >= start;
      });
    }

    if (endDate) {
      // Ajustar endDate al final del día
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();

      filtrados = filtrados.filter((r) => {
        if (!r.fecha_cierre) return false;
        return new Date(r.fecha_cierre).getTime() <= endTime;
      });
    }

    setFilteredResults(filtrados);
  }, [resultadosRaw, startDate, endDate]);

  // Handlers UI
  const handleProfesorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProfesor(val);
    setSelectedMateria("");
    if (val) fetchEstadisticas("profesor", val);
    else setResultadosRaw([]);
  };

  const handleMateriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedMateria(val);
    setSelectedProfesor("");
    if (val) fetchEstadisticas("materia", val);
    else setResultadosRaw([]);
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAccordion = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Obtener objetos completos para la comparación
  const itemsToCompare = useMemo(() => {
    if (selectedIds.length !== 2) return null;
    const r1 = filteredResults.find((r) => r.cursada_id === selectedIds[0]);
    const r2 = filteredResults.find((r) => r.cursada_id === selectedIds[1]);
    if (r1 && r2) return { r1, r2 };
    return null;
  }, [selectedIds, filteredResults]);

  // --- RENDER ---

  if (showComparison && itemsToCompare) {
    return (
      <div className="p-6 max-w-[95%] mx-auto">
        <ComparacionView
          r1={itemsToCompare.r1}
          r2={itemsToCompare.r2}
          onClose={() => setShowComparison(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Estadísticas de Cursadas
        </h1>

        {/* Botón Comparar Flotante/Visible si hay selección */}
        <div
          className={`transition-opacity duration-300 ${
            selectedIds.length === 2 ? "opacity-100" : "opacity-50"
          }`}
        >
          <Button
            disabled={selectedIds.length !== 2}
            onClick={() => setShowComparison(true)}
            variant="primary"
          >
            Comparar Seleccionados ({selectedIds.length}/2)
          </Button>
        </div>
      </div>

      {/* PANEL DE FILTROS */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Profesor
            </label>
            <select
              value={selectedProfesor}
              onChange={handleProfesorChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Seleccione --</option>
              {profesoresList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Materia
            </label>
            <select
              value={selectedMateria}
              onChange={handleMateriaChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Seleccione --</option>
              {materiasList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtro de Fechas (Solo visible si hay resultados cargados) */}
        {resultadosRaw.length > 0 && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* RESULTADOS */}
      <div>
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 text-center">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* ESTADO VACÍO */}
        {!loading &&
          !error &&
          filteredResults.length === 0 &&
          (selectedProfesor || selectedMateria) && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 mt-6">
              <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No se encontraron estadísticas
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                {resultadosRaw.length === 0
                  ? "Este profesor o materia no tiene encuestas cerradas registradas en el sistema."
                  : "No hay resultados que coincidan con el rango de fechas seleccionado."}
              </p>
            </div>
          )}

        {/* LISTA DE RESULTADOS (ESTO ES LO QUE FALTABA) */}
        {!loading && !error && filteredResults.length > 0 && (
          <div className="space-y-4 mt-6">
            {filteredResults.map((resultado) => (
              <CursadaAccordionItem
                key={resultado.cursada_id}
                resultado={resultado}
                isSelected={selectedIds.includes(resultado.cursada_id)}
                onToggleSelection={toggleSelection}
                isOpen={openItems.includes(resultado.cursada_id)}
                onToggleOpen={() => toggleAccordion(resultado.cursada_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartamentoEstadisticasCursadas;