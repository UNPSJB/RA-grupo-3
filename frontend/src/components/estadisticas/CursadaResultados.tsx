import React, { useMemo } from "react";
import PieChartGeneral from "./PieChartGeneral.tsx";

import RadarChartGeneral from "./RadarChartGeneral.tsx";
import SectionBreakdownTable from "./SectionBreakdownTable.tsx";
import type { ResultadoCursada } from "../../types/estadisticas.ts";

// --- Helper para normalizar (sin cambios) ---
const normalizeLabel = (value: string) => value.trim().toLowerCase();

// --- Props (sin cambios) ---
interface CursadaResultadosProps {
  resultado: ResultadoCursada;
}

// --- Paletas de Colores (sin cambios) ---
const PALETA_SI_NO = {
  Sí: "#1A9850",
  No: "#D73027",
  "No puedo opinar (NPO)": "#ABD9E9",
};
const PALETA_BASICO_G1 = {
  "Muy satisfactorio (4)": "#1A9850",
  "Satisfactorio (3)": "#91CF60",
  "Poco Satisfactorio (2)": "#FEE08B",
  "No satisfactorio (1)": "#D73027",
};
const PALETA_SUPERIOR = {
  "Muy Bueno / Muy satisfactorio (4)": "#1A9850",
  "Bueno / Satisfactorio (3)": "#91CF60",
  "Regular / Poco Satisfactorio (2)": "#FEE08B",
  "Malo / No Satisfactorio (1)": "#D73027",
};

// --- Componente ---
const CursadaResultados: React.FC<CursadaResultadosProps> = ({ resultado }) => {
  // (sin cambios)
  const allMcPreguntas = useMemo(
    () =>
      resultado.resultados_por_seccion.flatMap((s) =>
        s.resultados_por_pregunta.filter(
          (p) => p.pregunta_tipo === "MULTIPLE_CHOICE" && p.resultados_opciones
        )
      ),
    [resultado.resultados_por_seccion]
  );

  // (sin cambios)
  const isCicloSuperior = useMemo(() => {
    const preguntaOpinion = allMcPreguntas.find((p) =>
      p.pregunta_texto.includes("cómo evalúas tu experiencia")
    );
    return (
      preguntaOpinion?.resultados_opciones?.some((o) =>
        o.opcion_texto.includes("Muy Bueno / Muy satisfactorio (4)")
      ) || false
    );
  }, [allMcPreguntas]);

  // (sin cambios)
  const seriesMap = useMemo(() => {
    const map: { [key: string]: { label: string; color: string } } = {};
    const paleta = { ...PALETA_SI_NO, ...PALETA_BASICO_G1, ...PALETA_SUPERIOR };

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

  // (sin cambios)
  const opinionGlobalData = useMemo(() => {
    // ... (lógica existente) ...
    const preguntaOpinion = allMcPreguntas.find((p) =>
      p.pregunta_texto.includes("cómo evalúas tu experiencia")
    );
    if (!preguntaOpinion || !preguntaOpinion.resultados_opciones) return [];
    return preguntaOpinion.resultados_opciones
      .filter((opt) => opt.cantidad > 0)
      .map((opt) => ({
        name: opt.opcion_texto,
        value: opt.cantidad,
        color: seriesMap[normalizeLabel(opt.opcion_texto)]?.color,
      }));
  }, [allMcPreguntas, seriesMap]);

  // (sin cambios)
  const siNoNpoData = useMemo(() => {
    // ... (lógica existente para Ciclo Básico) ...
    if (isCicloSuperior) return [];
    // ... (resto de la lógica)
    const preguntasSiNo = allMcPreguntas.filter((p) =>
      p.resultados_opciones?.some((opt) => opt.opcion_texto === "Sí")
    );
    if (preguntasSiNo.length === 0) return [];
    let totalPercentSi = 0;
    let totalPercentNo = 0;
    let totalPercentNPO = 0;
    preguntasSiNo.forEach((p) => {
      const totalRespuestasPregunta = (p.resultados_opciones || []).reduce(
        (sum, opt) => sum + opt.cantidad,
        0
      );
      if (totalRespuestasPregunta === 0) return;
      const optSi = p.resultados_opciones?.find((o) => o.opcion_texto === "Sí");
      const optNo = p.resultados_opciones?.find((o) => o.opcion_texto === "No");
      const optNPO = p.resultados_opciones?.find(
        (o) => o.opcion_texto === "No puedo opinar (NPO)"
      );
      totalPercentSi += (optSi?.cantidad ?? 0) / totalRespuestasPregunta;
      totalPercentNo += (optNo?.cantidad ?? 0) / totalRespuestasPregunta;
      totalPercentNPO += (optNPO?.cantidad ?? 0) / totalRespuestasPregunta;
    });
    const numPreguntas = preguntasSiNo.length;
    const data = [
      {
        name: "Sí",
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
  }, [allMcPreguntas, isCicloSuperior]);

  // --- 3. LÓGICA MODIFICADA: Ahora para el Gráfico Radial (Ciclo Superior) ---
  const radarChartData = useMemo(() => {
    if (!isCicloSuperior) return [];

    // Usamos un Map para acumular los puntajes de las secciones (y arreglar la "E" duplicada)
    const dataMap = new Map<
      string,
      { totalPuntuacion: number; totalRespuestas: number }
    >();

    const seccionesRelevantes = resultado.resultados_por_seccion.filter(
      (s) => !s.seccion_nombre.startsWith("A:") // Excluir Sección A
    );

    seccionesRelevantes.forEach((seccion) => {
      // --- SOLUCIÓN A DUPLICACIÓN "E:" ---
      // Obtenemos la letra de la sección (B, C, D, E, F, G)
      let seccionKey = seccion.seccion_nombre.split(":")[0]; // "E"

      // Inicializamos o obtenemos el acumulador para esta sección
      if (!dataMap.has(seccionKey)) {
        dataMap.set(seccionKey, { totalPuntuacion: 0, totalRespuestas: 0 });
      }
      const seccionAcumulador = dataMap.get(seccionKey)!;

      // Sumamos los valores de todas las preguntas de esta sección (sea Teoría o Práctica)
      seccion.resultados_por_pregunta.forEach((pregunta) => {
        if (
          pregunta.pregunta_tipo === "MULTIPLE_CHOICE" &&
          pregunta.resultados_opciones
        ) {
          pregunta.resultados_opciones.forEach((opcion) => {
            // Extraer el número de la opción (ej. 4 de "Muy Bueno (4)")
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

    // Convertimos el Map al formato que necesita el gráfico radial
    return Array.from(dataMap.entries()).map(([key, data]) => ({
      subject: key, // "B", "C", "E", etc.
      score:
        data.totalRespuestas > 0
          ? parseFloat((data.totalPuntuacion / data.totalRespuestas).toFixed(2))
          : 0,
      fullMark: 4, // El máximo de la escala es 4
    }));
  }, [resultado.resultados_por_seccion, isCicloSuperior]);

  // --- 4. RENDERIZADO (MODIFICADO) ---
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-10">
      {/* Header (sin cambios) */}
      <header className="space-y-1 border-b pb-4">
        {/* ... */}
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

      {/* Gráficos de Resumen (Gráfico de la derecha ahora es condicional) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
        <PieChartGeneral
          title="Opinión Global (Pregunta G.1)"
          data={opinionGlobalData}
          valueSuffix=" resp."
        />

        {/* --- Lógica condicional para mostrar el segundo gráfico --- */}
        {isCicloSuperior ? (
          // 4a. Mostrar el Gráfico Radial para Ciclo Superior
          <RadarChartGeneral
            title="Promedio por Sección (B-G)"
            data={radarChartData}
          />
        ) : siNoNpoData.length > 0 ? (
          // 4b. Mostrar el Pie Chart de "Sí/No" para Ciclo Básico
          <PieChartGeneral
            title='Promedio "Sí / No / NPO" (Otras preguntas)'
            data={siNoNpoData}
            valueSuffix="%"
          />
        ) : (
          // 4c. Fallback por si no hay datos
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-center items-center">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
              Resumen de Preguntas
            </h3>
            <p className="text-sm text-gray-500 text-center">
              (No hay datos para este resumen)
            </p>
          </div>
        )}
      </div>

      {/* Tabla Acordeón (sin cambios) */}
      <SectionBreakdownTable
        secciones={resultado.resultados_por_seccion}
        seriesMap={seriesMap}
      />
    </div>
  );
};

export default CursadaResultados;
