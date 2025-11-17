import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import type { 
  InformeSinteticoList, 
  InformeSinteticoResultado 
} from "../types/estadisticas"; // Importamos los nuevos tipos

// Importamos los componentes de gráficos
import PieChartGeneral from "../components/estadisticas/PieChartGeneral";
import RadarChartGeneral from "../components/estadisticas/RadarChartGeneral";
import SectionBreakdownTable from "../components/estadisticas/SectionBreakdownTable";
import Spinner from "../components/Spinner";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Componente para mostrar los detalles (lo creamos aquí mismo)
const EstadisticasDetalle: React.FC<{ 
  informe: InformeSinteticoResultado,
  onVolver: () => void 
}> = ({ informe, onVolver }) => {
  
  // Lógica para los gráficos (adaptada de CursadaResultados)
  // NOTA: Esta lógica asume que las plantillas de informe son similares
  // a las de Ciclo Superior (preguntas G.1 y secciones B-G)

  const allMcPreguntas = useMemo(
    () =>
      informe.resultados_por_seccion.flatMap((s) =>
        s.resultados_por_pregunta.filter(
          (p) => p.pregunta_tipo === "MULTIPLE_CHOICE" && p.resultados_opciones
        )
      ),
    [informe.resultados_por_seccion]
  );
  
  // 1. Datos para el PieChart (Opinión Global)
  const opinionGlobalData = useMemo(() => {
    const preguntaOpinion = allMcPreguntas.find((p) =>
      p.pregunta_texto.includes("cómo evalúas tu experiencia") || 
      p.pregunta_texto.includes("2.B") // Fallback por si la G.1 no está
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

  // 2. Datos para el RadarChart (Promedio por Sección)
  const radarChartData = useMemo(() => {
    const dataMap = new Map<
      string,
      { totalPuntuacion: number; totalRespuestas: number }
    >();
    
    // Filtramos secciones que NO sean la A (Información General)
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
        if (
          pregunta.pregunta_tipo === "MULTIPLE_CHOICE" &&
          pregunta.resultados_opciones
        ) {
          pregunta.resultados_opciones.forEach((opcion) => {
            const match = opcion.opcion_texto.match(/\((\d)\)/); // Busca (4), (3), etc.
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

  // 3. Mapa de series para la tabla (simplificado)
  const seriesMap = useMemo(() => {
     // ... (puedes copiar la lógica de CursadaResultados si es necesario, 
     // pero por ahora una paleta simple funciona)
     return {};
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-10">
      <button
        onClick={onVolver}
        className="text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        &larr; Volver al listado de informes
      </button>

      <header className="space-y-1 border-b pb-4">
        <h3 className="text-xl font-semibold text-indigo-700">
          Informe Sintético (ID: {informe.informe_id})
        </h3>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <p className="text-sm text-gray-600">
            Dpto: {informe.departamento_nombre}
          </p>
          <p className="text-sm font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded-full self-start">
            {informe.cantidad_total_reportes} Reportes de Profesor Agregados
          </p>
        </div>
        <p className="text-xs text-gray-500 pt-1">
            Generado: {new Date(informe.fecha_generacion).toLocaleString()}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
        <PieChartGeneral
          title="Opinión Global (Pregunta G.1 o similar)"
          data={opinionGlobalData}
          valueSuffix=" resp."
        />
        <RadarChartGeneral
          title="Promedio por Sección (B-G)"
          data={radarChartData}
        />
      </div>

      <SectionBreakdownTable
        secciones={informe.resultados_por_seccion}
        seriesMap={seriesMap}
      />
    </div>
  );
};


// Componente Principal
const DepartamentoEstadisticas: React.FC = () => {
  const { token, logout } = useAuth();
  
  // Estados de la lista
  const [informesList, setInformesList] = useState<InformeSinteticoList[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Estados de la vista detallada
  const [selectedInformeId, setSelectedInformeId] = useState<number | null>(null);
  const [informeDetalle, setInformeDetalle] = useState<InformeSinteticoResultado | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  // Cargar la lista de informes generados
  const fetchInformesList = async () => {
    setLoadingList(true);
    setErrorList(null);
    if (!token) {
      setErrorList("Sesión expirada.");
      logout();
      return;
    }
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

  // Cargar la lista al montar el componente
  useEffect(() => {
    fetchInformesList();
  }, [token, logout]);

  // Cargar los detalles de un informe cuando se selecciona
  useEffect(() => {
    if (!selectedInformeId || !token) {
      setInformeDetalle(null); // Limpia el detalle si no hay ID
      return;
    }

    const fetchDetalle = async () => {
      setLoadingDetalle(true);
      setErrorDetalle(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/departamento/informes-sinteticos/${selectedInformeId}/estadisticas`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.detail || "No se pudo cargar el detalle del informe.");
        }
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

  // Handler para el botón "Generar"
  const handleGenerarInforme = async () => {
    setIsGenerating(true);
    setErrorList(null); // Limpia errores viejos
    if (!token) {
      setErrorList("Sesión expirada.");
      logout();
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/departamento/informes-sinteticos/generar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Error al generar el informe.");
      }
      
      // Si tuvo éxito, recargamos la lista
      fetchInformesList(); 

    } catch (err) {
      setErrorList(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // --- RENDERIZADO ---
  
  // Vista de Carga o Error de Detalle
  if (loadingDetalle) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Spinner />
      </div>
    );
  }
  if (errorDetalle) {
    return (
       <div className="p-6 max-w-5xl mx-auto text-center">
         <p className="text-red-600">{errorDetalle}</p>
         <button
            onClick={() => setSelectedInformeId(null)}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            &larr; Volver al listado
          </button>
       </div>
    );
  }
  
  // Vista de Detalle (si hay un informe cargado)
  if (informeDetalle) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <EstadisticasDetalle 
          informe={informeDetalle} 
          onVolver={() => setSelectedInformeId(null)} 
        />
      </div>
    );
  }

  // Vista de Lista (Default)
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Informes Sintéticos
        </h1>
        <button
          onClick={handleGenerarInforme}
          disabled={isGenerating || loadingList}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
        >
          {isGenerating ? "Generando..." : "Generar Nuevo Informe"}
        </button>
      </div>
      
      {loadingList && <Spinner />}
      
      {errorList && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md text-center" role="alert">
           <p className="font-bold">¡Error!</p>
           <p>{errorList}</p>
         </div>
      )}

      {!loadingList && !errorList && informesList.length === 0 && (
        <div className="text-center py-10 text-gray-600 bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <p className="text-xl font-semibold mt-4">No hay informes</p>
          <p className="text-base mt-2 text-gray-500">
            Aún no se ha generado ningún informe sintético.
          </p>
          <p className="text-base mt-1 text-gray-500">
            Presiona "Generar Nuevo Informe" para agrupar los reportes de profesores.
          </p>
        </div>
      )}

      {!loadingList && informesList.length > 0 && (
        <div className="space-y-3">
          {informesList.map((informe) => (
            <div
              key={informe.id}
              className="bg-white p-4 rounded shadow border flex flex-col sm:flex-row justify-between items-start sm:items-center"
            >
              <div className="mb-3 sm:mb-0">
                <h3 className="text-lg font-semibold text-gray-800">
                  Informe Sintético (ID: {informe.id})
                </h3>
                <p className="text-sm text-gray-600">
                  Generado: {new Date(informe.fecha_inicio).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Reportes agrupados: {informe.cantidad_reportes}
                </p>
              </div>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600 w-full sm:w-auto"
                onClick={() => setSelectedInformeId(informe.id)}
              >
                Ver Estadísticas
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartamentoEstadisticas;