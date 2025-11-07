import React, { useMemo } from "react";
import PieChartGeneral from "./PieChartGeneral.tsx";
import SectionBreakdownTable from "./SectionBreakdownTable.tsx";
import type { ResultadoCursada } from "../../types/estadisticas.ts";

// --- Helper para normalizar ---
const normalizeLabel = (value: string) => value.trim().toLowerCase();

// --- Props ---
interface CursadaResultadosProps {
  resultado: ResultadoCursada;
}

// --- Paletas de Colores ---
const PALETA_OPINION = {
  "Muy satisfactorio (4)": "#1A9850",
  "Satisfactorio (3)": "#91CF60",
  "Poco Satisfactorio (2)": "#FEE08B",
  "No satisfactorio (1)": "#D73027",
};
const PALETA_SI_NO = {
  Sí: "#1A9850",
  No: "#D73027",
  "No puedo opinar (NPO)": "#ABD9E9",
};

// --- Componente ---
const CursadaResultados: React.FC<CursadaResultadosProps> = ({ resultado }) => {
  // 1. Aplanamos todas las preguntas de opción múltiple
  const allMcPreguntas = useMemo(
    () =>
      resultado.resultados_por_seccion.flatMap((s) =>
        s.resultados_por_pregunta.filter(
          (p) => p.pregunta_tipo === "MULTIPLE_CHOICE" && p.resultados_opciones
        )
      ),
    [resultado.resultados_por_seccion]
  );

  // 2. Creamos un "mapa" de series (opciones únicas) para darles color
  const seriesMap = useMemo(() => {
    const map: { [key: string]: { label: string; color: string } } = {};
    const paleta = { ...PALETA_OPINION, ...PALETA_SI_NO };

    allMcPreguntas.forEach((pregunta) => {
      pregunta.resultados_opciones!.forEach((option) => {
        const key = normalizeLabel(option.opcion_texto);
        if (!map[key]) {
          map[key] = {
            label: option.opcion_texto,
            // @ts-ignore
            color: paleta[option.opcion_texto] || "#8884d8",
          };
        }
      });
    });
    return map;
  }, [allMcPreguntas]);

  // 3. Datos para el Gráfico de Opinión Global (Total de Respuestas)
  const opinionGlobalData = useMemo(() => {
    const preguntaOpinion = allMcPreguntas.find((p) =>
      p.pregunta_texto.includes("cómo evalúas tu experiencia")
    );
    if (!preguntaOpinion || !preguntaOpinion.resultados_opciones) return [];

    return preguntaOpinion.resultados_opciones
      .filter((opt) => opt.cantidad > 0)
      .map((opt) => ({
        name: opt.opcion_texto,
        value: opt.cantidad, // El valor es el CONTEO de alumnos
        color: seriesMap[normalizeLabel(opt.opcion_texto)]?.color,
      }));
  }, [allMcPreguntas, seriesMap]);

  // --- INICIO DE LA CORRECCIÓN "560" ---

  // 4. Datos para el Gráfico Resumen Sí/No/NPO (Promedio de Porcentajes)
  const siNoNpoData = useMemo(() => {
    // Filtramos solo las preguntas Sí/No/NPO
    const preguntasSiNo = allMcPreguntas.filter(
      (p) => !p.pregunta_texto.includes("cómo evalúas tu experiencia")
    );

    if (preguntasSiNo.length === 0) return []; // No hay preguntas para promediar

    let totalPercentSi = 0;
    let totalPercentNo = 0;
    let totalPercentNPO = 0;

    preguntasSiNo.forEach((p) => {
      // Calculamos el total de respuestas SOLO para esta pregunta (ej. 20)
      const totalRespuestasPregunta = (p.resultados_opciones || []).reduce(
        (sum, opt) => sum + opt.cantidad,
        0
      );
      if (totalRespuestasPregunta === 0) return; // Evitar división por cero

      const optSi = p.resultados_opciones?.find((o) => o.opcion_texto === "Sí");
      const optNo = p.resultados_opciones?.find((o) => o.opcion_texto === "No");
      const optNPO = p.resultados_opciones?.find(
        (o) => o.opcion_texto === "No puedo opinar (NPO)"
      );

      // Sumamos el PORCENTAJE de esta pregunta
      totalPercentSi += (optSi?.cantidad ?? 0) / totalRespuestasPregunta;
      totalPercentNo += (optNo?.cantidad ?? 0) / totalRespuestasPregunta;
      totalPercentNPO += (optNPO?.cantidad ?? 0) / totalRespuestasPregunta;
    });

    const numPreguntas = preguntasSiNo.length;

    // Creamos los datos para el gráfico de torta con los promedios
    const data = [
      {
        name: "Sí",
        // Calculamos el promedio y lo formateamos a 1 decimal
        value: parseFloat(((totalPercentSi / numPreguntas) * 100).toFixed(1)),
        color: PALETA_SI_NO["Sí"],
      },
      {
        name: "No",
        value: parseFloat(((totalPercentNo / numPreguntas) * 100).toFixed(1)),
        color: PALETA_SI_NO["No"],
      },
      {
        name: "NPO",
        value: parseFloat(((totalPercentNPO / numPreguntas) * 100).toFixed(1)),
        color: PALETA_SI_NO["No puedo opinar (NPO)"],
      },
    ];

    return data;
  }, [allMcPreguntas]);

  // --- FIN DE LA CORRECCIÓN ---

  // --- RENDERIZADO ---
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-10">
      {/* Header de la Cursada (sin cambios) */}
      <header className="space-y-1 border-b pb-4">
        <h3 className="text-xl font-semibold text-indigo-700">
          {resultado.materia_nombre}
        </h3>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <p className="text-sm text-gray-600">{resultado.cuatrimestre_info}</p>
          <p className="text-sm font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded-full self-start">
            {resultado.cantidad_respuestas}{" "}
            {resultado.cantidad_respuestas === 1 ? "Respuesta" : "Respuestas"}
          </p>
        </div>
      </header>

      {/* 5. Gráficos de Torta (Resumen General) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
        <PieChartGeneral
          title="Opinión Global (Pregunta G.1)"
          data={opinionGlobalData}
          valueSuffix=" resp." // Le decimos que el valor es un conteo
        />
        <PieChartGeneral
          title='Promedio "Sí / No / NPO" (Otras preguntas)'
          data={siNoNpoData}
          valueSuffix="%" // Le decimos que el valor es un porcentaje
        />
      </div>

      {/* 6. Tabla Acordeón (Resumen por Sección) */}
      <SectionBreakdownTable
        secciones={resultado.resultados_por_seccion}
        seriesMap={seriesMap}
      />
    </div>
  );
};

export default CursadaResultados;
