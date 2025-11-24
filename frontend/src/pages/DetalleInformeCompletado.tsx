import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import type {
  InformeSinteticoList,
  InformeCompletoLectura,
  DashboardDepartamentoStats,
} from "../types/estadisticas";

// Gráficos para el Dashboard General
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

import Spinner from "../components/Spinner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      {/* Gráfico Donut */}
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

      {/* Gráfico Barras */}
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
                tick={{ fontSize: 10 }}
              />
              <YAxis
                dataKey="label"
                type="category"
                width={70}
                tick={{ fontSize: 10 }}
              />
              <RechartsTooltip cursor={{ fill: "#F3F4F6" }} />
              <Bar
                dataKey="value"
                fill={COLORS.azul}
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista Alertas */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Necesidades Recientes
          </h3>
          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
            {stats.necesidades_recientes.length}
          </span>
        </div>
        <div className="flex-grow overflow-y-auto max-h-[200px] space-y-3">
          {stats.necesidades_recientes.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center mt-10">
              Sin requerimientos.
            </p>
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

// --- COMPONENTE 2: VISOR DE INFORME TEXTUAL (NUEVO) ---
const InformeLectura: React.FC<{
  informe: InformeCompletoLectura;
  onVolver: () => void;
}> = ({ informe, onVolver }) => {
  const handleExportPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Encabezado PDF más prolijo
    doc.setFillColor(41, 128, 185); // Azul
    doc.rect(0, 0, 210, 15, "F"); // Barra superior decorativa

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(informe.titulo, 14, 30);
    yPos = 40;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Departamento: ${informe.departamento}`, 14, yPos);
    doc.text(
      `Fecha de emisión: ${new Date(informe.fecha).toLocaleDateString()}`,
      14,
      yPos + 5
    );
    yPos += 15;

    informe.secciones.forEach((seccion) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      // Título de Sección resaltado
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPos - 5, 182, 8, "F"); // Fondo gris suave para título
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(seccion.seccion_nombre, 16, yPos);
      yPos += 8;

      const bodyData = seccion.preguntas.map((p) => [
        p.pregunta_texto,
        p.respuesta_texto === "Sin respuesta registrada."
          ? "-"
          : p.respuesta_texto,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Ítem", "Detalle / Respuesta"]],
        body: bodyData,
        theme: "grid",
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [80, 80, 80],
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: "bold" }, // Pregunta en negrita
          1: { cellWidth: "auto" },
        },
        didDrawPage: (d) => {
          yPos = d.cursor ? d.cursor.y + 10 : 20;
        },
        margin: { top: 20 },
      });

      // @ts-ignore
      if (doc.lastAutoTable) yPos = doc.lastAutoTable.finalY + 10;
    });
    doc.save(`Informe_Sintetico_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20 max-w-5xl mx-auto">
      {/* Barra de Herramientas Superior */}
      <div className="sticky top-0 z-10 bg-[#f1f5f9]/90 backdrop-blur-sm py-4 flex justify-between items-center border-b border-gray-200/50">
        <button
          onClick={onVolver}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors font-medium px-2 py-1 rounded-md hover:bg-white/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Volver
        </button>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-all hover:border-indigo-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Descargar PDF
        </button>
      </div>

      {/* Documento Visual */}
      <div className="bg-white shadow-lg rounded-none sm:rounded-lg border border-gray-200 overflow-hidden min-h-[800px]">
        {/* Encabezado del Documento */}
        <div className="bg-slate-50 px-8 py-10 border-b border-gray-200 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
          <div className="inline-block p-3 rounded-full bg-indigo-50 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-800 mb-2">
            {informe.titulo}
          </h1>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mt-4">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              {informe.departamento}
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(informe.fecha).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Cuerpo del Informe */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-10">
          {informe.secciones.map((seccion, index) => (
            <section key={index} className="relative">
              {/* Línea conectora vertical */}
              {index !== informe.secciones.length - 1 && (
                <div className="absolute left-[11px] top-8 bottom-[-40px] w-px bg-gray-200 hidden md:block"></div>
              )}

              <div className="flex gap-4">
                {/* Número de Sección (Decorativo) */}
                <div className="flex-shrink-0 hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold border-2 border-white ring-1 ring-gray-200 mt-1">
                  {index}
                </div>

                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 mb-5 pb-2 border-b border-gray-100 flex items-center gap-2">
                    {seccion.seccion_nombre}
                  </h3>

                  <div className="grid gap-6">
                    {seccion.preguntas.map((preg, idx) => {
                      const isEmpty =
                        preg.respuesta_texto === "Sin respuesta registrada." ||
                        !preg.respuesta_texto;
                      return (
                        <div
                          key={idx}
                          className={`group ${
                            isEmpty
                              ? "opacity-60 hover:opacity-100 transition-opacity"
                              : ""
                          }`}
                        >
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-start gap-2">
                            <span className="text-indigo-400 mt-1 text-[10px]">
                              ●
                            </span>
                            {preg.pregunta_texto}
                          </h4>

                          {isEmpty ? (
                            <div className="ml-4 text-sm text-gray-400 italic bg-gray-50/50 px-3 py-2 rounded border border-dashed border-gray-200">
                              — Sin respuesta registrada —
                            </div>
                          ) : (
                            <div className="ml-4 text-sm text-gray-800 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 leading-relaxed shadow-sm group-hover:border-indigo-100 group-hover:shadow-md transition-all">
                              {preg.respuesta_texto}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Pie del Documento */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 text-center">
          <p className="text-xs text-gray-400">
            Documento generado por el Sistema de Gestión Académica - Facultad de
            Ingeniería
          </p>
        </div>
      </div>
    </div>
  );
};
// --- PÁGINA PRINCIPAL ---
const DetalleInformeCompleto: React.FC = () => {
  const { token } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString()
  );

  const [dashboardStats, setDashboardStats] =
    useState<DashboardDepartamentoStats | null>(null);
  const [informesList, setInformesList] = useState<InformeSinteticoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para ver el detalle (AHORA USA EL TIPO TEXTUAL)
  const [selectedInformeId, setSelectedInformeId] = useState<number | null>(
    null
  );
  const [informeLectura, setInformeLectura] =
    useState<InformeCompletoLectura | null>(null);

  // Carga Inicial
  useEffect(() => {
    if (!token) return;
    const loadAll = async () => {
      setLoading(true);
      try {
        const resStats = await fetch(
          `${API_BASE_URL}/departamento/estadisticas-generales`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const resList = await fetch(
          `${API_BASE_URL}/departamento/informes-sinteticos`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

  // CAMBIO CLAVE: Cargar el texto completo en lugar de estadísticas
  useEffect(() => {
    if (!selectedInformeId || !token) {
      setInformeLectura(null);
      return;
    }
    setLoading(true); // Mostrar spinner mientras carga el detalle
    fetch(
      `${API_BASE_URL}/departamento/informes-sinteticos/${selectedInformeId}/exportar-completo`, // Usamos el endpoint de texto
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => res.json())
      .then((data) => setInformeLectura(data))
      .finally(() => setLoading(false));
  }, [selectedInformeId, token]);

  // Filtro
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

  // --- RENDERIZADO DEL DETALLE ---
  if (selectedInformeId && informeLectura) {
    return (
      <InformeLectura
        informe={informeLectura}
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
                        <span className="text-yellow-600 text-xs font-bold bg-yellow-100 px-2 py-1 rounded">
                          Pendiente
                        </span>
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

export default DetalleInformeCompleto;
