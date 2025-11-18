import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import type { 
  InformeSinteticoList, 
  InformeSinteticoResultado 
} from "../types/estadisticas";

// Componentes gráficos y UI
import PieChartGeneral from "../components/estadisticas/PieChartGeneral";
import RadarChartGeneral from "../components/estadisticas/RadarChartGeneral";
import SectionBreakdownTable from "../components/estadisticas/SectionBreakdownTable";
import Spinner from "../components/Spinner";
import { Button } from "../components/Button"; // Reutilizamos tu componente Button
import { jsPDF } from "jspdf"; // Para exportar
import autoTable from "jspdf-autotable"; // Para tablas en PDF

// Iconos (puedes usar los que ya tienes o importar heroicons)
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
  </svg>
);

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
  </svg>
);

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- COMPONENTE DE DETALLE MEJORADO ---
const EstadisticasDetalle: React.FC<{ 
  informe: InformeSinteticoResultado,
  onVolver: () => void 
}> = ({ informe, onVolver }) => {
  
  // --- Lógica de Gráficos (Igual que antes) ---
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
    const preguntaOpinion = allMcPreguntas.find((p) =>
      p.pregunta_texto.includes("cómo evalúas tu experiencia") || 
      p.pregunta_texto.includes("2.B")
    );
    if (!preguntaOpinion || !preguntaOpinion.resultados_opciones) return [];
    
    return preguntaOpinion.resultados_opciones
      .filter((opt) => opt.cantidad > 0)
      .map((opt) => ({
        name: opt.opcion_texto,
        value: opt.cantidad,
        color: opt.opcion_texto.includes("(4)") ? "#1A9850" : 
               opt.opcion_texto.includes("(3)") ? "#91CF60" :
               opt.opcion_texto.includes("(2)") ? "#FEE08B" : "#D73027",
      }));
  }, [allMcPreguntas]);

  const radarChartData = useMemo(() => {
    const dataMap = new Map<string, { totalPuntuacion: number; totalRespuestas: number }>();
    const seccionesRelevantes = informe.resultados_por_seccion.filter(
      (s) => !s.seccion_nombre.startsWith("A:") && !s.seccion_nombre.startsWith("1.")
    );

    seccionesRelevantes.forEach((seccion) => {
      let seccionKey = seccion.seccion_nombre.split(":")[0] || "Secc"; 
      if (!dataMap.has(seccionKey)) {
        dataMap.set(seccionKey, { totalPuntuacion: 0, totalRespuestas: 0 });
      }
      const seccionAcumulador = dataMap.get(seccionKey)!;

      seccion.resultados_por_pregunta.forEach((pregunta) => {
        if (pregunta.pregunta_tipo === "MULTIPLE_CHOICE" && pregunta.resultados_opciones) {
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
      score: data.totalRespuestas > 0 ? parseFloat((data.totalPuntuacion / data.totalRespuestas).toFixed(2)) : 0,
      fullMark: 4, 
    }));
  }, [informe.resultados_por_seccion]);

  const seriesMap = useMemo(() => ({}), []);

  // --- Exportar a PDF Simple ---
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Informe Sintético #${informe.informe_id}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Departamento: ${informe.departamento_nombre}`, 14, 30);
    doc.text(`Fecha: ${new Date(informe.fecha_generacion).toLocaleDateString()}`, 14, 36);
    
    const tableData = informe.resultados_por_seccion.map(sec => [sec.seccion_nombre]);
    
    autoTable(doc, {
      startY: 45,
      head: [['Secciones Incluidas']],
      body: tableData,
    });
    
    doc.save(`Informe_Sintetico_${informe.informe_id}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Navegación y Acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={onVolver}
          className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
        >
          &larr; Volver al listado
        </button>
        
        <button 
          onClick={handleExportPDF}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2"
        >
          <DocumentIcon />
          Descargar PDF
        </button>
      </div>

      {/* Encabezado Principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Informe Sintético #{informe.informe_id}</h2>
            <p className="text-gray-500 mt-1">{informe.departamento_nombre}</p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-semibold text-sm">
            <span>{informe.cantidad_total_reportes} Reportes Agregados</span>
          </div>
        </div>

        {/* Tarjetas de KPI (Resumen rápido) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 border-t border-gray-100 pt-6">
           <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Fecha Generación</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {new Date(informe.fecha_generacion).toLocaleDateString()}
              </p>
           </div>
           <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Respuestas</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {/* Suma aproximada basada en el gráfico global */}
                 {opinionGlobalData.reduce((acc, curr) => acc + curr.value, 0)}
              </p>
           </div>
           <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Satisfacción Global</p>
              <div className="flex items-center gap-2 mt-1">
                 {/* Lógica visual simple para satisfacción */}
                 <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${opinionGlobalData.find(x => x.name.includes("(4)"))?.value || 0}%` }}
                    />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        <PieChartGeneral
          title="Opinión Global (Satisfacción)"
          data={opinionGlobalData}
          valueSuffix=" resp."
        />
        <RadarChartGeneral
          title="Promedio por Sección (Escala 1-4)"
          data={radarChartData}
        />
      </div>

      {/* Tabla de desglose */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <SectionBreakdownTable
          secciones={informe.resultados_por_seccion}
          seriesMap={seriesMap}
        />
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
const DepartamentoEstadisticas: React.FC = () => {
  const { token, logout } = useAuth();
  
  const [informesList, setInformesList] = useState<InformeSinteticoList[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedInformeId, setSelectedInformeId] = useState<number | null>(null);
  const [informeDetalle, setInformeDetalle] = useState<InformeSinteticoResultado | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  // Cargar lista
  const fetchInformesList = async () => {
    setLoadingList(true);
    setErrorList(null);
    if (!token) { setErrorList("Sesión expirada."); logout(); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/departamento/informes-sinteticos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("No se pudo cargar la lista de informes.");
      const data: InformeSinteticoList[] = await response.json();
      setInformesList(data);
    } catch (err) {
      setErrorList(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchInformesList(); }, [token, logout]);

  // Cargar detalle
  useEffect(() => {
    if (!selectedInformeId || !token) {
      setInformeDetalle(null);
      return;
    }
    const fetchDetalle = async () => {
      setLoadingDetalle(true);
      setErrorDetalle(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/departamento/informes-sinteticos/${selectedInformeId}/estadisticas`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("No se pudo cargar el detalle.");
        const data: InformeSinteticoResultado = await response.json();
        setInformeDetalle(data);
      } catch (err) {
        setErrorDetalle(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoadingDetalle(false);
      }
    };
    fetchDetalle();
  }, [selectedInformeId, token, logout]);

  // Generar nuevo informe
  const handleGenerarInforme = async () => {
    setIsGenerating(true);
    setErrorList(null);
    try {
      const response = await fetch(`${API_BASE_URL}/departamento/informes-sinteticos/generar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Error al generar el informe.");
      }
      fetchInformesList(); 
    } catch (err) {
      setErrorList(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // --- RENDER CONDICIONAL ---
  
  if (selectedInformeId) {
    if (loadingDetalle) return <Spinner />;
    if (errorDetalle) return (
      <div className="p-8 text-center bg-white rounded-lg shadow mx-auto max-w-2xl mt-10">
         <p className="text-red-600 mb-4">{errorDetalle}</p>
         <Button onClick={() => setSelectedInformeId(null)}>Volver</Button>
      </div>
    );
    if (informeDetalle) return (
      <div className="max-w-6xl mx-auto p-6">
         <EstadisticasDetalle informe={informeDetalle} onVolver={() => setSelectedInformeId(null)} />
      </div>
    );
  }

  // Vista de Lista (Dashboard Principal)
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Informes Sintéticos</h1>
          <p className="text-gray-500 mt-1">Gestión y visualización de reportes de departamento.</p>
        </div>
        <button
          onClick={handleGenerarInforme}
          disabled={isGenerating || loadingList}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md disabled:bg-indigo-300 flex items-center gap-2"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">Generando...</span>
          ) : (
            <><span>+</span> Generar Informe Actual</>
          )}
        </button>
      </div>
      
      {loadingList && <div className="py-10"><Spinner /></div>}
      
      {errorList && (
         <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
           <p className="font-bold">Error</p> <p>{errorList}</p>
         </div>
      )}

      {!loadingList && !errorList && informesList.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
             <ChartIcon />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No hay informes generados</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza generando el primer informe sintético para este departamento.</p>
        </div>
      )}

      {/* TABLA DE INFORMES (Mejora Visual) */}
      {!loadingList && informesList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Generación</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportes Agregados</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {informesList.map((informe) => (
                <tr key={informe.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{informe.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(informe.fecha_inicio).toLocaleDateString()} 
                    <span className="text-xs text-gray-400 ml-1">
                      ({new Date(informe.fecha_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {informe.cantidad_reportes} reportes
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedInformeId(informe.id)}
                      className="text-indigo-600 hover:text-indigo-900 font-semibold hover:underline"
                    >
                      Ver Estadísticas &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DepartamentoEstadisticas;