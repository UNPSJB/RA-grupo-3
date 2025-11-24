import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import type {
  InformeSinteticoList,
  InformeSinteticoResultado,
  DashboardDepartamentoStats,
} from "../types/estadisticas";

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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Componentes existentes
import Spinner from "../components/Spinner";
import { Button } from "../components/Button";
import SectionBreakdownTable from "../components/estadisticas/SectionBreakdownTable";

// Librerías para PDF
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- ICONOS ---
const ChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
  </svg>
);

const DocumentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
      clipRule="evenodd"
    />
  </svg>
);

// --- COLORES ---
const COLORS = {
  completado: "#10B981", // Verde Esmeralda
  pendiente: "#F59E0B", // Ámbar
  azul: "#3B82F6", // Azul
};

// --- COMPONENTE: DASHBOARD GENERAL (Tablero de Gestión) ---
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
        <p className="text-gray-500">
          No hay datos suficientes para generar el tablero de control.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      {/* 1. ESTADO DE INFORMES (Donut) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
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

      {/* 2. COBERTURA DE CONTENIDOS (Barras) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
          Cobertura Curricular (Sec. 2.A)
        </h3>
        <div className="flex-grow min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.cobertura_contenidos}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                label={{
                  value: "Cant. Materias",
                  position: "insideBottom",
                  offset: -10,
                  style: { fontSize: 10, fill: "#9CA3AF", fontWeight: "bold" },
                }}
              />
              <YAxis
                dataKey="label"
                type="category"
                width={70}
                tick={{ fontSize: 10 }}
              />
              <RechartsTooltip
                cursor={{ fill: "#F3F4F6" }}
                formatter={(value: number) => [`${value} materias`, "Cantidad"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar
                dataKey="value"
                fill={COLORS.azul}
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          Rango de contenido dictado vs Cantidad de materias
        </p>
      </div>

      {/* 3. ALERTAS DE INFRAESTRUCTURA (Lista) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Necesidades Recientes
          </h3>
          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
            {stats.necesidades_recientes.length}
          </span>
        </div>
        <div className="flex-grow overflow-y-auto max-h-[200px] pr-2 custom-scrollbar space-y-3">
          {stats.necesidades_recientes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm italic">Sin requerimientos pendientes.</p>
            </div>
          ) : (
            stats.necesidades_recientes.map((req, idx) => (
              <div
                key={idx}
                className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {req.startsWith("[") ? (
                  <>
                    <span className="font-bold text-indigo-600 block mb-1 text-xs uppercase tracking-wide">
                      {req.substring(1, req.indexOf("]"))}
                    </span>
                    <span className="leading-relaxed">
                      {req.substring(req.indexOf("]") + 1)}
                    </span>
                  </>
                ) : (
                  req
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE: DETALLE DE INFORME (Con Pestañas para separar gráficos de tablas) ---
const EstadisticasDetalle: React.FC<{
  informe: InformeSinteticoResultado;
  onVolver: () => void;
}> = ({ informe, onVolver }) => {
  const [activeTab, setActiveTab] = useState<"resumen" | "detalle">("resumen");

  // 1. Lógica de Datos
  const allMcPreguntas = useMemo(
    () =>
      informe.resultados_por_seccion.flatMap((s) =>
        s.resultados_por_pregunta.filter(
          (p) => p.pregunta_tipo === "MULTIPLE_CHOICE" && p.resultados_opciones
        )
      ),
    [informe.resultados_por_seccion]
  );

  const opinionGlobalData = useMemo(() => {
    const preguntaOpinion = allMcPreguntas.find(
      (p) =>
        p.pregunta_texto.includes("cómo evalúas tu experiencia") ||
        p.pregunta_texto.includes("2.B")
    );
    if (!preguntaOpinion || !preguntaOpinion.resultados_opciones) return [];

    return preguntaOpinion.resultados_opciones
      .filter((opt) => opt.cantidad > 0)
      .map((opt) => ({
        name: opt.opcion_texto,
        value: opt.cantidad,
        color: opt.opcion_texto.includes("(4)")
          ? "#1A9850"
          : opt.opcion_texto.includes("(3)")
          ? "#91CF60"
          : opt.opcion_texto.includes("(2)")
          ? "#FEE08B"
          : "#D73027",
      }));
  }, [allMcPreguntas]);

  const radarChartData = useMemo(() => {
    const dataMap = new Map<
      string,
      { totalPuntuacion: number; totalRespuestas: number }
    >();
    const seccionesRelevantes = informe.resultados_por_seccion.filter(
      (s) =>
        !s.seccion_nombre.startsWith("A:") && !s.seccion_nombre.startsWith("1.")
    );

    seccionesRelevantes.forEach((seccion) => {
      let seccionKey = seccion.seccion_nombre.split(":")[0].trim();
      if (!dataMap.has(seccionKey)) {
        dataMap.set(seccionKey, { totalPuntuacion: 0, totalRespuestas: 0 });
      }
      const seccionAcumulador = dataMap.get(seccionKey)!;

      seccion.resultados_por_pregunta.forEach((pregunta) => {
        if (
          pregunta.pregunta_tipo === "MULTIPLE_CHOICE" &&
          pregunta.resultados_opciones
        ) {
          pregunta.resultados_opciones.forEach((opcion) => {
            const match = opcion.opcion_texto.match(/\((\d)\)/);
            if (match && opcion.cantidad > 0) {
              const puntuacion = parseInt(match[1]);
              seccionAcumulador.totalPuntuacion += puntuacion * opcion.cantidad;
              seccionAcumulador.totalRespuestas += opcion.cantidad;
            }
          });
        }
      });
    });

    return Array.from(dataMap.entries()).map(([key, data]) => ({
      subject: key,
      score:
        data.totalRespuestas > 0
          ? parseFloat((data.totalPuntuacion / data.totalRespuestas).toFixed(2))
          : 0,
      fullMark: 4,
    }));
  }, [informe.resultados_por_seccion]);

  const seriesMap = useMemo(() => ({}), []);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Informe Estadístico #${informe.informe_id}`, 14, 20);
    doc.text(`Departamento: ${informe.departamento_nombre}`, 14, 30);
    const tableData = informe.resultados_por_seccion.map((sec) => [
      sec.seccion_nombre,
    ]);
    autoTable(doc, { startY: 40, head: [["Secciones"]], body: tableData });
    doc.save(`Informe_${informe.informe_id}.pdf`);
  };

  // 2. Renderizado con Pestañas
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={onVolver}
          className="text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1"
        >
          &larr; Volver
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-white border px-4 py-2 rounded shadow-sm hover:bg-gray-50 text-sm font-medium flex gap-2 items-center"
        >
          <DocumentIcon /> Descargar PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reporte Consolidado de Alumnos
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Informe #{informe.informe_id} - {informe.departamento_nombre}
          </p>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-bold text-indigo-600">
            {informe.cantidad_total_reportes}
          </span>
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            Cátedras
          </span>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("resumen")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "resumen"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Resumen Gráfico
          </button>
          <button
            onClick={() => setActiveTab("detalle")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "detalle"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Detalle de Respuestas (Lista)
          </button>
        </nav>
      </div>

      {activeTab === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Pie Chart (Satisfacción) */}
          {/* CAMBIO: Quitamos 'h-full' y agregamos 'min-h-[300px]' para estabilidad */}
          <div className="min-h-[350px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
              Satisfacción Global (Alumnos)
            </h3>
            <div className="flex-grow">
              {/* CAMBIO: width="99%" ayuda a evitar el colapso en grids */}
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie
                    data={opinionGlobalData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {opinionGlobalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart (El que se rompió) */}
          {/* CAMBIO: Quitamos 'h-full' y usamos 'min-h' */}
          <div className="min-h-[350px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
              Desempeño por Áreas (Escala 1-4)
            </h3>
            <div className="flex-grow">
              {/* CAMBIO: width="99%" y height fijo o 100% dentro de flex-grow */}
              <ResponsiveContainer width="99%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={radarChartData}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 4]} angle={30} />
                  <Radar
                    name="Promedio"
                    dataKey="score"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
            <strong>Referencias del Radar:</strong> B (Comunicación), C
            (Metodología), D (Evaluación), E (Actuación Docente).
          </div>
        </div>
      )}
      {activeTab === "detalle" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Desglose pregunta por pregunta
            </h3>
            <p className="text-sm text-gray-500">
              Suma total de respuestas de todas las cátedras.
            </p>
          </div>
          <SectionBreakdownTable
            secciones={informe.resultados_por_seccion}
            seriesMap={seriesMap}
          />
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (PÁGINA) ---
const DepartamentoEstadisticas: React.FC = () => {
  const { token, logout } = useAuth();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString()
  );

  const [dashboardStats, setDashboardStats] =
    useState<DashboardDepartamentoStats | null>(null);
  const [informesList, setInformesList] = useState<InformeSinteticoList[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedInformeId, setSelectedInformeId] = useState<number | null>(
    null
  );
  const [informeDetalle, setInformeDetalle] =
    useState<InformeSinteticoResultado | null>(null);

  // Carga Inicial
  useEffect(() => {
    if (!token) return;
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const resStats = await fetch(
          `${API_BASE_URL}/departamento/estadisticas-generales`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const resList = await fetch(
          `${API_BASE_URL}/departamento/informes-sinteticos`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (resStats.ok) setDashboardStats(await resStats.json());
        if (resList.ok) setInformesList(await resList.json());
      } catch (err) {
        let msg = "Ocurrió un error desconocido.";
        if (err instanceof Error) msg = err.message;
        // Filtrar errores de conexión típicos
        if (msg.includes("Failed to fetch"))
          msg = "No se pudo conectar con el servidor. Verifica tu conexión.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [token]);

  // Cargar Detalle
  useEffect(() => {
    if (!selectedInformeId || !token) {
      setInformeDetalle(null);
      return;
    }
    fetch(
      `${API_BASE_URL}/departamento/informes-sinteticos/${selectedInformeId}/estadisticas`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => setInformeDetalle(data));
  }, [selectedInformeId, token]);

  // Filtro de Año para la Lista
  const informesFiltrados = useMemo(() => {
    let filtrados = informesList;
    if (selectedYear) {
      filtrados = filtrados.filter((informe) => {
        const fecha = new Date(informe.fecha_inicio);
        return fecha.getFullYear().toString() === selectedYear;
      });
    }
    return filtrados.sort(
      (a, b) =>
        new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    );
  }, [informesList, selectedYear]);

  if (selectedInformeId && informeDetalle) {
    return (
      <EstadisticasDetalle
        informe={informeDetalle}
        onVolver={() => setSelectedInformeId(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
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
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          >
            <option value="">Todos</option>
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map(
              (year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20">
          <Spinner />
        </div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex flex-col items-center text-center text-amber-800">
          <p className="font-medium">No se pudieron cargar los datos</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : (
        <>
          {/* 1. DASHBOARD GRÁFICO */}
          {dashboardStats && <DashboardGeneral stats={dashboardStats} />}

          {/* 2. LISTADO HISTÓRICO */}
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
                      No hay informes en este período.
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
                        {
                          /* @ts-ignore */ inf.estado === "COMPLETADO" ? (
                            <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded">
                              Completado
                            </span>
                          ) : (
                            <span className="text-yellow-600 text-xs font-bold bg-yellow-100 px-2 py-1 rounded">
                              Pendiente
                            </span>
                          )
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedInformeId(inf.id)}
                          className="text-indigo-600 hover:underline text-sm font-semibold"
                        >
                          Ver Detalle
                        </button>
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

export default DepartamentoEstadisticas;
