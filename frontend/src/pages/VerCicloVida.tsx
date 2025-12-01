import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Interfaces adaptadas al nuevo schema
interface Materia {
  nombre: string;
}
interface Cursada {
  materia: Materia;
}
interface Encuesta {
  id: number;
  estado: string;
  cursada: Cursada;
}
interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio_encuesta: string;
  fecha_fin_encuesta: string;
  fecha_limite_informe: string | null;
  fecha_limite_sintetico: string | null;
  encuestas: Encuesta[];
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "Sin definir";
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PeriodoCard: React.FC<{ periodo: Periodo }> = ({ periodo }) => {
  const [showMaterias, setShowMaterias] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 transition-all hover:shadow-md">
      {/* Encabezado Gris */}
      <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-3">
            {periodo.nombre}
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                new Date(periodo.fecha_fin_encuesta) > new Date()
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-200 text-gray-600 border-gray-300"
              }`}
            >
              {new Date(periodo.fecha_fin_encuesta) > new Date()
                ? "Activo"
                : "Finalizado"}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Creado: ID #{periodo.id} • Total materias:{" "}
            {periodo.encuestas.length}
          </p>
        </div>
        <button
          onClick={() => setShowMaterias(!showMaterias)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
        >
          {showMaterias ? "Ocultar Materias" : "Ver Materias"}
          <svg
            className={`w-4 h-4 transition-transform ${
              showMaterias ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Grid de Plazos */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        {/* Columna 1: Encuestas */}
        <div className="flex flex-col space-y-3 border-l-4 border-gray-300 pl-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Encuestas Alumnos
          </span>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Apertura</p>
            <p className="font-semibold text-gray-800">
              {formatDate(periodo.fecha_inicio_encuesta)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Cierre Automático</p>
            <p className="font-bold text-gray-900">
              {formatDate(periodo.fecha_fin_encuesta)}
            </p>
          </div>
        </div>

        {/* Columna 2: Informes */}
        <div className="flex flex-col space-y-3 border-l-4 border-gray-300 pl-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Informes de Cátedra
          </span>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Vencimiento</p>
            {periodo.fecha_limite_informe ? (
              <p className="font-bold text-gray-900">
                {formatDate(periodo.fecha_limite_informe)}
              </p>
            ) : (
              <p className="text-gray-400 italic">Sin límite definido</p>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Habilitado tras cierre de encuesta.
          </p>
        </div>

        {/* Columna 3: Sintéticos */}
        <div className="flex flex-col space-y-3 border-l-4 border-gray-300 pl-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Informe Sintético
          </span>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">
              Generación Automática
            </p>
            {periodo.fecha_limite_sintetico ? (
              <p className="font-bold text-gray-900">
                {formatDate(periodo.fecha_limite_sintetico)}
              </p>
            ) : (
              <p className="text-gray-400 italic">Sin límite definido</p>
            )}
          </div>
          <p className="text-xs text-gray-400">Agrupa informes por Dpto.</p>
        </div>
      </div>

      {/* Lista Desplegable de Materias */}
      {showMaterias && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 animate-fadeIn">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Materias Incluidas
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {periodo.encuestas.map((enc) => (
              <div
                key={enc.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-xs"
              >
                <span className="text-gray-700 font-medium truncate pr-2" title={enc.cursada.materia.nombre}>
                  {enc.cursada.materia.nombre}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    enc.estado === "activa"
                      ? "bg-green-100 text-green-800"
                      : enc.estado === "cerrada"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {enc.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const VerCicloVida: React.FC = () => {
  const { token } = useAuth();
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/admin/gestion-encuestas/periodos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPeriodos(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Plazos Establecidos
          </h1>
          <p className="text-gray-500 mt-1">
            Historial de ciclos de encuestas y sus fechas de vencimiento.
          </p>
        </div>

        <Link
          to="/secretaria/modelos"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Configurar Nuevo Ciclo
        </Link>
      </div>

      {periodos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium">
            No hay ciclos definidos.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Comienza configurando un nuevo periodo de encuestas.
          </p>
        </div>
      ) : (
        <div>
          {periodos.map((periodo) => (
            <PeriodoCard key={periodo.id} periodo={periodo} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VerCicloVida;