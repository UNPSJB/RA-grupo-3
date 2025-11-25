import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- Interfaces ---
interface Opcion {
  id: number;
  texto: string;
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE";
  opciones?: Opcion[];
}

interface Seccion {
  id: number;
  nombre: string;
  preguntas: Pregunta[];
}

interface PlantillaReporte {
  id: number;
  titulo: string;
  descripcion: string;
  secciones: Seccion[];
  materia_nombre: string;
  anio: number;
  sede: string;
  codigo: string;
  docente_responsable: string;
  cantidad_inscriptos?: number;
}

const VerReporteProfesor: React.FC = () => {
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [plantilla, setPlantilla] = useState<PlantillaReporte | null>(null);
  const [respuestas, setRespuestas] = useState<{ [key: number]: string | number }>({});
  
  // Inicializamos en true, pero gestionaremos con cuidado en el useEffect
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Si no hay token, esperamos (el AuthContext puede estar cargando)
    if (!token) return; 
    
    // 2. Si no hay ID en la URL, es un error fatal de ruta
    if (!instanciaId) {
        setError("ID de reporte no válido.");
        setLoading(false);
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 3. Carga en PARALELO para evitar bloqueos secuenciales
        const [resPlantilla, resRespuestas] = await Promise.all([
            fetch(
                `${API_BASE_URL}/encuestas-abiertas/reporte/instancia/${instanciaId}/detalles`,
                { headers: { Authorization: `Bearer ${token}` } }
            ),
            fetch(
                `${API_BASE_URL}/encuestas-abiertas/reporte/instancia/${instanciaId}/respuestas`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
        ]);

        // 4. Verificar Plantilla (Crítico)
        if (!resPlantilla.ok) {
            const errData = await resPlantilla.json().catch(() => ({}));
            throw new Error(errData.detail || "No se pudo cargar la estructura del reporte.");
        }
        setPlantilla(await resPlantilla.json());

        // 5. Verificar Respuestas (Opcional - si falla, mostramos vacío)
        if (resRespuestas.ok) {
            setRespuestas(await resRespuestas.json());
        } else {
            console.warn("No se pudieron cargar las respuestas o no existen.");
        }

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error desconocido al cargar el reporte.");
      } finally {
        // 6. SIEMPRE apagar el loading
        setLoading(false);
      }
    };

    fetchData();
  }, [instanciaId, token]);

  // Funciones auxiliares de renderizado
  const getRespuestaTexto = (pregunta: Pregunta) => {
    const val = respuestas[pregunta.id];
    if (val === undefined || val === null) return <span className="text-gray-400 italic">- Sin respuesta -</span>;

    if (pregunta.tipo === "MULTIPLE_CHOICE") {
      const op = pregunta.opciones?.find((o) => o.id === val);
      return op ? op.texto : String(val);
    }
    return String(val);
  };

  const parseCombinedValue = (preguntaId: number) => {
    const val = String(respuestas[preguntaId] || "");
    if (val.includes(" ||| ")) {
      const [v, just] = val.split(" ||| ");
      return { valor: v, justificacion: just };
    }
    return { valor: "", justificacion: val };
  };

  // Generación de PDF
  const handleDescargarPDF = () => {
    if (!plantilla) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(plantilla.titulo, 14, 20);
    doc.setFontSize(12);
    doc.text(`${plantilla.materia_nombre} - ${plantilla.anio}`, 14, 28);
    
    let yPos = 35;

    plantilla.secciones.forEach((seccion) => {
        doc.setFontSize(14);
        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPos - 6, 182, 10, 'F');
        doc.text(seccion.nombre, 14, yPos);
        yPos += 15;

        const bodyData = seccion.preguntas.map(p => {
             let textoResp = "";
             const val = respuestas[p.id];
             
             if (typeof val === "string" && val.includes(" ||| ")) {
                 const [v, j] = val.split(" ||| ");
                 textoResp = `${v}\nJustif: ${j}`;
             } else if (p.tipo === "MULTIPLE_CHOICE") {
                 const op = p.opciones?.find(o => o.id === val);
                 textoResp = op ? op.texto : "-";
             } else {
                 textoResp = String(val || "-");
             }
             return [p.texto, textoResp];
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Ítem', 'Respuesta']],
            body: bodyData,
            theme: 'grid',
            columnStyles: { 0: { cellWidth: 80 } },
            didDrawPage: (d) => yPos = d.cursor ? d.cursor.y + 10 : 20
        });
        
        // @ts-ignore
        if (doc.lastAutoTable) yPos = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`Reporte_${plantilla.materia_nombre}.pdf`);
  };

  if (loading) return <Spinner />;
  
  if (error) return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <h3 className="text-red-800 font-bold text-lg mb-2">No se pudo cargar el reporte</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button onClick={() => navigate("/profesores/reportes")} className="text-indigo-600 hover:underline">Volver al listado</button>
    </div>
  );

  if (!plantilla) return null; // Should not happen due to error check

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 animate-fadeIn">
      
      {/* Barra Superior */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate("/profesores/reportes")}
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver al listado
        </button>
        <button 
          onClick={handleDescargarPDF}
          className="bg-white text-blue-700 border border-blue-200 px-4 py-2 rounded-md shadow-sm hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar PDF
        </button>
      </div>

      {/* Documento Visual */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-none sm:rounded-lg overflow-hidden border border-gray-200">
        
        {/* Encabezado */}
        <div className="bg-slate-50 p-8 border-b border-slate-200 text-center print:bg-white">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Informe de Actividad Curricular</h2>
            <h1 className="text-3xl font-serif font-bold text-slate-800 mb-6">{plantilla.materia_nombre}</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 text-sm text-slate-600 mt-6 border-t border-slate-200 pt-6">
                <div><span className="block font-bold text-slate-400 text-xs uppercase mb-1">Año</span>{plantilla.anio}</div>
                <div><span className="block font-bold text-slate-400 text-xs uppercase mb-1">Sede</span>{plantilla.sede}</div>
                <div><span className="block font-bold text-slate-400 text-xs uppercase mb-1">Código</span>{plantilla.codigo}</div>
                <div><span className="block font-bold text-slate-400 text-xs uppercase mb-1">Responsable</span>{plantilla.docente_responsable}</div>
            </div>
        </div>

        {/* Contenido */}
        <div className="p-8 md:p-12 space-y-12">
          {plantilla.secciones.map((seccion) => (
            <section key={seccion.id}>
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-100 pb-2 mb-6 flex items-center">
                 <span className="bg-slate-100 text-slate-500 text-sm px-2 py-1 rounded mr-3 font-mono font-normal">{seccion.nombre.split(" ")[0]}</span>
                 {seccion.nombre.substring(seccion.nombre.indexOf(" ") + 1)}
              </h3>

              <div className="space-y-8">
                {seccion.preguntas.map((pregunta) => {
                  const esHibrida = pregunta.texto.includes("Porcentaje") || pregunta.texto.startsWith("4.");
                  const { valor, justificacion } = parseCombinedValue(pregunta.id);

                  if (esHibrida) {
                      return (
                          <div key={pregunta.id} className="bg-slate-50/50 p-5 rounded-lg border border-slate-100">
                              <p className="font-semibold text-slate-800 mb-4 text-sm">{pregunta.texto}</p>
                              <div className="flex flex-col sm:flex-row gap-4">
                                  <div className="sm:w-1/3 md:w-1/4">
                                      <div className="bg-white border border-slate-200 p-3 rounded text-center h-full flex flex-col justify-center">
                                          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Valor</span>
                                          <span className="text-lg font-bold text-blue-600">{valor || "-"}</span>
                                      </div>
                                  </div>
                                  <div className="sm:w-2/3 md:w-3/4">
                                      <div className="bg-white border border-slate-200 p-3 rounded h-full">
                                          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Justificación / Detalle</span>
                                          <p className="text-sm text-slate-600 italic">{justificacion || "Sin justificación registrada."}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )
                  }

                  return (
                    <div key={pregunta.id} className="break-inside-avoid">
                        <p className="font-semibold text-slate-800 mb-2 text-sm">{pregunta.texto}</p>
                        <div className="pl-4 border-l-4 border-slate-200 py-1 ml-1">
                            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">
                                {getRespuestaTexto(pregunta)}
                            </p>
                        </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Pie */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-center">
             <p className="text-xs text-slate-400">Sistema de Gestión de Calidad Académica • Documento generado digitalmente</p>
        </div>

      </div>
    </div>
  );
};

export default VerReporteProfesor;