import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Definimos una estructura común para cualquier informe
export interface DatosInforme {
  titulo: string;
  subtitulo?: string;
  metadata: { label: string; value: string | number }[];
  secciones: {
    nombre: string;
    preguntas: {
      texto: string;
      respuesta: string;
    }[];
  }[];
}

interface Props {
  datos: DatosInforme;
  onVolver: () => void;
}

export const VisualizadorInforme: React.FC<Props> = ({ datos, onVolver }) => {
  const handleDescargarPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Encabezado
    doc.setFontSize(18);
    doc.text(datos.titulo, 14, 20);

    if (datos.subtitulo) {
      doc.setFontSize(12);
      doc.text(datos.subtitulo, 14, 28);
      yPos = 35;
    }

    // Metadata (ej: Año, Sede, Docente)
    doc.setFontSize(10);
    datos.metadata.forEach((meta) => {
      doc.text(`${meta.label}: ${meta.value}`, 14, yPos);
      yPos += 5;
    });
    yPos += 10;

    datos.secciones.forEach((seccion) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      // Título Sección
      doc.setFontSize(14);
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPos - 6, 182, 10, "F");
      doc.text(seccion.nombre, 14, yPos);
      yPos += 15;

      const bodyData = seccion.preguntas.map((p) => [p.texto, p.respuesta]);

      autoTable(doc, {
        startY: yPos,
        head: [["Pregunta", "Respuesta"]],
        body: bodyData,
        theme: "grid",
        columnStyles: { 0: { cellWidth: 80 } },
        didDrawPage: (d) => (yPos = d.cursor ? d.cursor.y + 10 : 20),
      });

      // @ts-ignore
      if (doc.lastAutoTable) yPos = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`Informe_${datos.titulo.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 animate-fadeIn">
      {/* Barra Superior */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6">
        <button
          onClick={onVolver}
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          ← Volver
        </button>
        <button
          onClick={handleDescargarPDF}
          className="bg-white text-blue-700 border border-blue-200 px-4 py-2 rounded-md shadow-sm hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
        >
          Descargar PDF
        </button>
      </div>

      {/* Documento Visual */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-none sm:rounded-lg overflow-hidden border border-gray-200">
        {/* Encabezado */}
        <div className="bg-slate-50 p-8 border-b border-slate-200 text-center">
          <h1 className="text-3xl font-serif font-bold text-slate-800 mb-4">
            {datos.titulo}
          </h1>
          {datos.subtitulo && (
            <p className="text-lg text-slate-600 mb-4">{datos.subtitulo}</p>
          )}

          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 mt-4 border-t border-slate-200 pt-4">
            {datos.metadata.map((meta, idx) => (
              <div key={idx} className="flex flex-col items-center px-4">
                <span className="font-bold text-slate-400 text-xs uppercase mb-1">
                  {meta.label}
                </span>
                <span className="font-medium text-slate-700">{meta.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-8 md:p-12 space-y-12">
          {datos.secciones.map((seccion, idx) => (
            <section key={idx}>
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-100 pb-2 mb-6 flex items-center">
                <span className="bg-slate-100 text-slate-500 text-sm px-2 py-1 rounded mr-3 font-mono">
                  Sec. {idx + 1}
                </span>
                {seccion.nombre}
              </h3>

              <div className="space-y-6">
                {seccion.preguntas.map((pregunta, pIdx) => (
                  <div key={pIdx}>
                    <p className="font-semibold text-slate-800 mb-2 text-sm">
                      {pregunta.texto}
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {pregunta.respuesta || (
                        <em className="text-gray-400">Sin respuesta</em>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
