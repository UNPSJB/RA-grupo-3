import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Opcion {
  id: number;
  texto: string;
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE";
  opciones?: Opcion[] | null;
  origen_datos?: string | null;
}

interface Seccion {
  id: number;
  nombre: string;
  preguntas: Pregunta[];
}

interface PlantillaInforme {
  id: number;
  titulo: string;
  descripcion: string;
  secciones: Seccion[];
}

const ResponderInforme: React.FC = () => {
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const navigate = useNavigate();

  const { token, logout } = useAuth();

  const [plantilla, setPlantilla] = useState<PlantillaInforme | null>(null);
  const [loading, setLoading] = useState(true);

  const [respuestas, setRespuestas] = useState<{
    [key: number]: string | number;
  }>({});

  const [activeTab, setActiveTab] = useState(0);

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorPreguntaId, setErrorPreguntaId] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setLoading(true);
        setMensaje(null);

        const res = await fetch(
          `${API_BASE_URL}/departamento/informes-sinteticos/instancia/${instanciaId}/detalles`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            logout();
            return;
          }
          const err = await res.json();
          throw new Error(err.detail);
        }

        const data = await res.json();
        setPlantilla(data);
      } catch (e) {
        setMensaje(
          e instanceof Error ? e.message : "Error al cargar el informe"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [instanciaId, token, logout]);

  const handleChange = (preguntaId: number, valor: string | number) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: valor,
    }));

    if (errorPreguntaId === preguntaId) {
      setErrorPreguntaId(null);
      setMensaje(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plantilla) return;

    const obligatorias = plantilla.secciones
      .flatMap((s) => s.preguntas)
      .filter((p) => p.tipo === "MULTIPLE_CHOICE");

    const falta = obligatorias.find((p) => !respuestas[p.id]);

    if (falta) {
      const indexTab = plantilla.secciones.findIndex((s) =>
        s.preguntas.some((p) => p.id === falta.id)
      );

      if (indexTab !== -1) setActiveTab(indexTab);

      setErrorPreguntaId(falta.id);
      setMensaje("Debes completar todas las preguntas obligatorias (*)");
      return;
    }

    const payload = {
      respuestas: Object.entries(respuestas).map(([id, valor]) => {
        const p = plantilla
          .secciones.flatMap((s) => s.preguntas)
          .find((x) => x.id === parseInt(id));

        if (!p) return null;

        if (p.tipo === "MULTIPLE_CHOICE") {
          return { pregunta_id: Number(id), opcion_id: valor };
        } else {
          return { pregunta_id: Number(id), texto: String(valor) };
        }
      }),
    };

    setEnviando(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/departamento/informes-sinteticos/instancia/${instanciaId}/responder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
          return;
        }
        const err = await res.json();
        throw new Error(err.detail);
      }

      setCompletado(true);
      setMensaje("¡Informe enviado correctamente!");
    } catch (e) {
      setMensaje(
        e instanceof Error ? e.message : "Error al enviar el informe"
      );
    } finally {
      setEnviando(false);
    }
  };

  const handlePDF = () => {
    if (!plantilla) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(plantilla.titulo, 14, 20);

    const body: any[] = [];

    plantilla.secciones.forEach((sec) => {
      body.push([
        {
          content: sec.nombre,
          colSpan: 2,
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
      ]);

      sec.preguntas.forEach((p) => {
        let resp = respuestas[p.id];
        let texto = "No respondida";

        if (p.tipo === "MULTIPLE_CHOICE") {
          const op = p.opciones?.find((o) => o.id === resp);
          texto = op?.texto || "No respondida";
        } else {
          texto = resp ? String(resp) : "No respondida";
        }

        body.push([p.texto, texto]);
      });
    });

    autoTable(doc, {
      startY: 30,
      head: [["Pregunta", "Respuesta"]],
      body,
    });

    doc.save(`Informe_Sintetico_${instanciaId}.pdf`);
  };

  if (loading)
    return (
      <p className="text-center mt-8 animate-pulse text-gray-500">
        Cargando informe...
      </p>
    );

  if (!plantilla)
    return (
      <p className="text-center mt-8 text-red-600">{mensaje || "Error"}</p>
    );

  if (completado) {
    return (
      <div className="flex flex-col items-center mt-20 space-y-6">
        <h2 className="text-xl font-bold text-green-700">
          ¡Informe enviado correctamente!
        </h2>
        <button
          onClick={() => navigate("/departamento")}
          className="bg-blue-600 text-white px-5 py-2 rounded"
        >
          Volver al inicio
        </button>
        <button
          onClick={handlePDF}
          className="bg-green-600 text-white px-5 py-2 rounded"
        >
          Descargar PDF
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow mt-6 border">
      <h1 className="text-2xl font-bold text-center text-indigo-800 mb-2">
        {plantilla.titulo}
      </h1>
      <p className="text-center text-gray-600 italic mb-6">
        {plantilla.descripcion}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex border-b border-gray-300 mb-4 overflow-x-auto">
          {plantilla.secciones.map((sec, i) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setActiveTab(i);
                setMensaje(null);
                setErrorPreguntaId(null);
              }}
              className={`py-3 px-5 ${
                activeTab === i
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {sec.nombre}
            </button>
          ))}
        </div>

        {plantilla.secciones.map((sec, i) => (
          <div key={sec.id} className={activeTab === i ? "block" : "hidden"}>
            {sec.preguntas.map((p) => (
              <div
                key={p.id}
                className={`p-4 bg-gray-50 rounded border ${
                  errorPreguntaId === p.id
                    ? "border-red-400 ring-2 ring-red-100"
                    : "border-gray-200"
                }`}
              >
                <p className="font-medium mb-3 text-gray-800">
                  {p.texto}
                  {p.tipo === "MULTIPLE_CHOICE" && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </p>

                {p.tipo === "REDACCION" ? (
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={6}
                    value={(respuestas[p.id] as string) || ""}
                    onChange={(e) => handleChange(p.id, e.target.value)}
                  />
                ) : (
                  <div className="space-y-2">
                    {p.opciones?.map((op) => (
                      <label
                        key={op.id}
                        className="flex items-center space-x-2 p-2 hover:bg-indigo-50"
                      >
                        <input
                          type="radio"
                          name={`preg-${p.id}`}
                          value={op.id}
                          checked={Number(respuestas[p.id]) === op.id}
                          onChange={() => handleChange(p.id, op.id)}
                        />
                        <span>{op.texto}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {mensaje && (
          <p className="text-center text-red-600 bg-red-100 p-2 rounded">
            {mensaje}
          </p>
        )}

        <div className="text-center">
          <button
            type="submit"
            disabled={enviando}
            className="bg-indigo-600 text-white px-8 py-3 rounded"
          >
            {enviando ? "Enviando..." : "Enviar Informe"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResponderInforme;
