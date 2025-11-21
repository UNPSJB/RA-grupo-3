import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Seccion2 from "../components/informe_sintetico/Seccion2";
import Seccion2A from "../components/informe_sintetico/Seccion2A";
import Seccion2B from "../components/informe_sintetico/Seccion2B";
import Seccion2C from "../components/informe_sintetico/Seccion2C";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface InformeCurricular {
  id: number;
  estado: "pendiente" | "completado";
  materia_nombre: string;
  profesor_nombre: string;
  cuatrimestre_info: string;
  equipamiento?: string;
  bibliografia?: string;
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE";
  opciones?: { id: number; texto: string }[] | null;
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
  const { token } = useAuth();

  const [plantilla, setPlantilla] = useState<PlantillaInforme | null>(null);
  const [informes, setInformes] = useState<InformeCurricular[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cuatrimestreSeleccionado, setCuatrimestreSeleccionado] = useState<string>("2025 - primero");
  const [informeSeleccionadoId, setInformeSeleccionadoId] = useState<string>("todas");
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setLoading(true);

        const resPlantilla = await fetch(
          `${API_BASE_URL}/departamento/instancia/${instanciaId}/detalles?departamento_id=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resPlantilla.ok) throw new Error("Error cargando plantilla");
        const dataPlantilla = await resPlantilla.json();
        setPlantilla(dataPlantilla);

        const resInformes = await fetch(
          `${API_BASE_URL}/departamento/mis-informes-curriculares`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resInformes.ok) throw new Error("Error cargando informes");
        const dataInformes = await resInformes.json();

        const filtrados = dataInformes
          .filter((i: InformeCurricular) => i.estado === "completado")
          .filter((i: InformeCurricular) => i.cuatrimestre_info === cuatrimestreSeleccionado);
        setInformes(filtrados);

        if (filtrados.length > 0) setInformeSeleccionadoId("todas");
      } catch (e) {
        setMensaje(e instanceof Error ? e.message : "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [instanciaId, token, cuatrimestreSeleccionado]);

  const informeSeleccionado = informeSeleccionadoId === "todas"
    ? null
    : informes.find(i => i.id === Number(informeSeleccionadoId));

  const materiasFiltradas = informeSeleccionado ? [informeSeleccionado] : informes;

  const handleInputChange = (key: string, valor: string) => {
    setRespuestas(prev => ({ ...prev, [key]: valor }));
  };

  if (loading)
    return <p className="text-center mt-8 animate-pulse text-gray-500">Cargando informe...</p>;

  if (!plantilla)
    return <p className="text-center mt-8 text-red-600">{mensaje || "Error"}</p>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow mt-6 border">
      <h1 className="text-2xl font-bold text-center text-indigo-800 mb-2">{plantilla.titulo}</h1>
      <p className="text-center text-gray-600 italic mb-6">{plantilla.descripcion}</p>
      <div className="flex border-b border-gray-300 mb-4 overflow-x-auto">
        {plantilla.secciones.map((sec, i) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => { setActiveTab(i); setMensaje(null); }}
            className={`py-3 px-5 ${activeTab === i ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {sec.nombre}
          </button>
        ))}
      </div>

      {/* Contenido secciones */}
      {plantilla.secciones.map((sec, i) => (
        <div key={sec.id} className={activeTab === i ? "block" : "hidden"}>
          {i === 0 ? (
            <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
              {sec.preguntas.map((p) => (
                <p key={p.id} className="font-medium mb-4 text-gray-800">{p.texto}</p>
              ))}

              <div className="mb-4 flex items-center space-x-2">
                <label className="font-medium text-gray-700">Cuatrimestre:</label>
                <select
                  className="border rounded p-1"
                  value={cuatrimestreSeleccionado}
                  onChange={(e) => setCuatrimestreSeleccionado(e.target.value)}
                >
                  <option value="2025 - primero">2025 - primero</option>
                  <option value="2025 - segundo">2025 - segundo</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <div className="flex font-bold bg-gray-100 p-2 rounded">
                  <div className="w-1/5">Código de la actividad curricular</div>
                  <div className="w-2/5">Actividad curricular</div>
                  <div className="w-1/5">Cantidad de alumnos inscriptos</div>
                  <div className="w-1/5">Cantidad de comisiones clases teóricas</div>
                  <div className="w-1/5">Cantidad de comisiones clases prácticas</div>
                </div>
                {informes.map((i) => (
                  <div key={i.id} className="flex border-b border-gray-200 p-2">
                    <div className="w-1/5">{i.id}</div>
                    <div className="w-2/5">{i.materia_nombre}</div>
                    <div className="w-1/5">-</div>
                    <div className="w-1/5">-</div>
                    <div className="w-1/5">-</div>
                  </div>
                ))}
              </div>
            </div>
          ) : i === 1 ? (
            <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
              {sec.preguntas.map((p) => (
                <p key={p.id} className="font-medium mb-4 text-gray-800">{p.texto}</p>
              ))}
              <div className="mb-4 flex items-center space-x-2">
                <label className="font-medium text-gray-700">Informe curricular:</label>
                <select
                  className="border rounded p-1"
                  value={informeSeleccionadoId}
                  onChange={(e) => setInformeSeleccionadoId(e.target.value)}
                >
                  <option value="todas">Todas</option>
                  {informes.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.materia_nombre} - {i.profesor_nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <div className="flex font-bold bg-gray-100 p-2 rounded">
                  <div className="w-2/5">Actividad curricular</div>
                  <div className="w-1/5">Equipamiento e insumos</div>
                  <div className="w-1/5">Bibliografía</div>
                </div>
                {materiasFiltradas.length > 0 ? (
                  materiasFiltradas.map((i) => (
                    <div key={i.id} className="flex border-b border-gray-200 p-2">
                      <div className="w-2/5">{`${i.id} - ${i.materia_nombre}`}</div>
                      <div className="w-1/5">{i.equipamiento ?? "-"}</div>
                      <div className="w-1/5">{i.bibliografia ?? "-"}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500">No hay informe seleccionado</div>
                )}
              </div>
            </div>
          ) : i === 2 ? (
            // Sección 2: 2, 2A, 2B, 2C
            <div>
              {sec.preguntas.map((p) => {
                console.log("Pregunta:", p.texto);

                if (p.texto.startsWith("2.") && !p.texto.startsWith("2.A") && !p.texto.startsWith("2.B") && !p.texto.startsWith("2.C")) {
                  return (
                    <div key={p.id} className="mb-4">
                      <p className="font-medium mb-3 text-gray-800">{p.texto}</p>
                      <Seccion2
                        materiasFiltradas={materiasFiltradas}
                        respuestas={respuestas}
                        handleInputChange={handleInputChange}
                        preguntaId={p.id}
                      />
                    </div>
                  );
                }

                if (p.texto.startsWith("2.A")) {
                  return (
                    <div key={p.id} className="mb-4">
                      <p className="font-medium mb-3 text-gray-800">{p.texto}</p>
                      <Seccion2A
                        materiasFiltradas={materiasFiltradas}
                        respuestas={respuestas}
                        handleInputChange={handleInputChange}
                        preguntaId={p.id}
                      />
                    </div>
                  );
                }

                if (p.texto.startsWith("2.B")) {
                  return (
                    <div key={p.id} className="mb-4">
                      <p className="font-medium mb-3 text-gray-800">{p.texto}</p>
                      <Seccion2B
                        materiasFiltradas={materiasFiltradas}
                        respuestas={respuestas}
                        handleInputChange={handleInputChange}
                        preguntaId={p.id}
                      />
                    </div>
                  );
                }

                if (p.texto.startsWith("2.C")) {
                  return (
                    <div key={p.id} className="mb-4">
                      <p className="font-medium mb-3 text-gray-800">{p.texto}</p>
                      <Seccion2C
                        materiasFiltradas={materiasFiltradas}
                        respuestas={respuestas}
                        handleInputChange={handleInputChange}
                        preguntaId={p.id}
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          ) : (
            sec.preguntas.map((p) => (
              <div key={p.id} className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
                <p className="font-medium mb-3 text-gray-800">{p.texto}</p>
                {p.tipo === "REDACCION" ? (
                  <textarea className="w-full p-2 border rounded" rows={6} readOnly value="" />
                ) : (
                  <div className="space-y-2">
                    {p.opciones?.map((op) => (
                      <label key={op.id} className="flex items-center space-x-2 p-2 hover:bg-indigo-50">
                        <input type="radio" disabled />
                        <span>{op.texto}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ))}

      {mensaje && (
        <p className="text-center text-red-600 bg-red-100 p-2 rounded">{mensaje}</p>
      )}
    </div>
  );
};

export default ResponderInforme;
