import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";

// IMPORTAMOS TU NUEVO COMPONENTE
import {
  VisualizadorInforme,
  DatosInforme,
} from "../components/VisualizadorInforme.tsx";

// Gráficos
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import type {
  InformeSinteticoList,
  InformeCompletoLectura,
  DashboardDepartamentoStats,
} from "../types/estadisticas";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- COLORES ---
const COLORS = {
  completado: "#10B981",
  pendiente: "#F59E0B",
  azul: "#3B82F6",
};

// --- COMPONENTE 1: DASHBOARD GENERAL (Se mantiene igual) ---
const DashboardGeneral: React.FC<{ stats: DashboardDepartamentoStats }> = ({
  stats,
}) => {
  const dataCumplimiento = [
    {
      name: "Completados",
      value: stats.informes_completados,
      color: COLORS.completado,
    },
    {
      name: "Pendientes",
      value: stats.informes_pendientes,
      color: COLORS.pendiente,
    },
  ];

  if (stats.informes_total === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center mb-8">
        <p className="text-gray-500">No hay datos suficientes.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 items-stretch">
      {/* Gráfico Donut */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Estado de Informes
        </h3>
        <div className="flex-grow min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataCumplimiento}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {dataCumplimiento.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <span className="text-3xl font-bold text-gray-800">
            {stats.informes_total}
          </span>
          <p className="text-xs text-gray-400 uppercase">Total Esperados</p>
        </div>
      </div>

      {/* Lista Alertas */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Necesidades Recientes
          </h3>
          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
            {stats.necesidades_recientes.length}
          </span>
        </div>
        <div className="flex-grow overflow-y-auto h-0 min-h-[250px] space-y-3 pr-2">
          {stats.necesidades_recientes.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-400 italic">
                Sin requerimientos.
              </p>
            </div>
          ) : (
            stats.necesidades_recientes.map((req, idx) => (
              <div
                key={idx}
                className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700"
              >
                {req}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
const DetalleInformeCompleto: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Estados
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString()
  );
  const [dashboardStats, setDashboardStats] =
    useState<DashboardDepartamentoStats | null>(null);
  const [informesList, setInformesList] = useState<InformeSinteticoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el Visualizador
  const [selectedInformeId, setSelectedInformeId] = useState<number | null>(
    null
  );
  const [informeLectura, setInformeLectura] =
    useState<InformeCompletoLectura | null>(null);

  // Carga Inicial del Dashboard
  useEffect(() => {
    if (!token) return;
    const loadAll = async () => {
      setLoading(true);
      try {
        const [resStats, resList] = await Promise.all([
          fetch(`${API_BASE_URL}/departamento/estadisticas-generales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/departamento/informes-sinteticos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (resStats.ok) setDashboardStats(await resStats.json());
        if (resList.ok) setInformesList(await resList.json());
      } catch (err) {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [token]);

  // Carga del Detalle (Cuando se selecciona un informe)
  useEffect(() => {
    if (!selectedInformeId || !token) {
      setInformeLectura(null);
      return;
    }
    setLoading(true);
    fetch(
      `${API_BASE_URL}/departamento/informes-sinteticos/${selectedInformeId}/exportar-completo`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => res.json())
      .then((data) => setInformeLectura(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedInformeId, token]);

  // Filtro por Año
  const informesFiltrados = useMemo(() => {
    let filtrados = informesList;
    if (selectedYear) {
      filtrados = filtrados.filter(
        (i) =>
          new Date(i.fecha_inicio).getFullYear().toString() === selectedYear
      );
    }
    return filtrados;
  }, [informesList, selectedYear]);

  // --- TRANSICIÓN AL VISUALIZADOR ---
  // Aquí convertimos los datos de tu API al formato genérico del componente
  if (selectedInformeId && informeLectura) {
    // Mapeo de datos para el componente genérico
    const datosParaVisualizar: DatosInforme = {
      titulo: informeLectura.titulo,
      subtitulo: `Departamento: ${informeLectura.departamento}`,
      metadata: [
        {
          label: "Fecha",
          value: new Date(informeLectura.fecha).toLocaleDateString(),
        },
        { label: "ID Informe", value: selectedInformeId },
        { label: "Estado", value: "Finalizado" },
        // --- CAMPO AGREGADO A LA CABECERA ---
        {
          label: "Comisión Asesora",
          value: informeLectura.integrantes_comision || "Sin datos registrados",
        },
        // ------------------------------------
      ],
      secciones: informeLectura.secciones.map((sec) => ({
        nombre: sec.seccion_nombre,
        preguntas: sec.preguntas.map((preg) => ({
          texto: preg.pregunta_texto,
          respuesta:
            preg.respuesta_texto === "Sin respuesta registrada."
              ? "-"
              : preg.respuesta_texto,
        })),
      })),
    };

    return (
      <VisualizadorInforme
        datos={datosParaVisualizar}
        onVolver={() => setSelectedInformeId(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tablero de Control
          </h1>
          <p className="text-gray-500 mt-1">
            Visión general del estado académico.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Filtrar por Año:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos</option>
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !informeLectura ? (
        <div className="py-20">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <>
          {dashboardStats && <DashboardGeneral stats={dashboardStats} />}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">
                Historial de Informes Sintéticos
              </h3>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {informesFiltrados.length} generados
              </span>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Resumen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {informesFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-500 italic"
                    >
                      No hay informes.
                    </td>
                  </tr>
                ) : (
                  informesFiltrados.map((inf) => (
                    <tr key={inf.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm text-gray-500">
                        #{inf.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(inf.fecha_inicio).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {inf.cantidad_reportes} materias
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {inf.estado === "pendiente" ? (
                          <span className="text-yellow-700 text-xs font-bold bg-yellow-100 px-2 py-1 rounded">
                            Pendiente
                          </span>
                        ) : (
                          <span className="text-green-700 text-xs font-bold bg-green-100 px-2 py-1 rounded">
                            Completado
                          </span>
                        )}
                      </td>

                      {/* --- COLUMNA DE ACCIÓN MODIFICADA --- */}
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {inf.estado === "pendiente" ? (
                          <button
                            onClick={() =>
                              navigate(
                                `/departamento/informe-sintetico/${inf.id}`
                              )
                            }
                            className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700 font-medium shadow-sm"
                          >
                            Completar
                          </button>
                        ) : (
                          <>
                            {/* Botón Ver Detalle (Lectura) */}
                            <button
                              onClick={() => setSelectedInformeId(inf.id)}
                              className="text-gray-600 hover:text-blue-600 text-xs font-semibold px-2 py-1 border border-gray-200 rounded"
                            >
                              Ver
                            </button>

                            {/* Botón Editar (Escritura) */}
                            <button
                              onClick={() =>
                                navigate(
                                  `/departamento/informe-sintetico/${inf.id}`
                                )
                              }
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-bold px-2 py-1 border border-indigo-100 bg-indigo-50 rounded"
                            >
                              Editar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DetalleInformeCompleto;
