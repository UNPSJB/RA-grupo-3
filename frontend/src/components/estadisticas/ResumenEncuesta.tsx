/*Componente reutilizable para generar resumen de encuesta. 
  Devuelve un texto plano con: 
  total de respuestas, cuantas veces se contestó una opción y su respectivo porcentaje.
*/

import React, { useMemo, useEffect } from "react";

interface ResultadoOpcion {
  opcion_id: number;
  opcion_texto: string;
  cantidad: number;
}

interface ResultadoPregunta {
  pregunta_id: number;
  pregunta_texto: string;
  pregunta_tipo: "MULTIPLE_CHOICE" | "REDACCION";
  resultados_opciones: ResultadoOpcion[] | null;
  respuestas_texto: { texto: string }[] | null;
}

interface ResultadoSeccion {
  seccion_nombre: string;
  resultados_por_pregunta: ResultadoPregunta[];
}

interface ResumenEncuestaProps {
  resultadosEncuesta: ResultadoSeccion[] | null;
  onGenerarResumen: (resumen: string) => void;
}


const ResumenEncuesta: React.FC<ResumenEncuestaProps> = ({
  resultadosEncuesta,
  onGenerarResumen,
}) => {
const resumen = useMemo(() => {
    if (!resultadosEncuesta) return "";

    let textoResumen = "";

    resultadosEncuesta.forEach((seccion) => {
      seccion.resultados_por_pregunta.forEach((pregunta) => {
        if (
          pregunta.pregunta_tipo === "MULTIPLE_CHOICE" &&
          pregunta.resultados_opciones &&
          pregunta.resultados_opciones.length > 0
        ) {
          const total = pregunta.resultados_opciones.reduce(
            (sum, opcion) => sum + opcion.cantidad,
            0
          );

          textoResumen += `Pregunta: ${pregunta.pregunta_texto}\n`;
          textoResumen += `Total de respuestas: ${total}\n`;

          pregunta.resultados_opciones.forEach((opcion) => {
            const porcentaje =
              total > 0 ? ((opcion.cantidad / total) * 100).toFixed(1) : "0.0";
            textoResumen += `- ${opcion.opcion_texto}: ${opcion.cantidad} respuestas (${porcentaje}%)\n`;
          });

          textoResumen += "\n";
        }
      });
    });

    return textoResumen.trim();
  }, [resultadosEncuesta]);

  useEffect(() => {
    if (resumen && onGenerarResumen) {
        onGenerarResumen(resumen);
    }
  }, [resumen, onGenerarResumen]);

    return null;
};

export default ResumenEncuesta;
