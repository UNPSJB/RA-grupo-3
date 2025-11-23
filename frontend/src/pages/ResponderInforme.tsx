import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Seccion2 from "../components/informe_sintetico/Seccion2";
import Seccion2A from "../components/informe_sintetico/Seccion2A";
import Seccion2B from "../components/informe_sintetico/Seccion2B";
import Seccion2C from "../components/informe_sintetico/Seccion2C";
import Seccion3 from "../components/informe_sintetico/Seccion3"; 
import Seccion4 from "../components/informe_sintetico/Seccion4"; 

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface InformeCurricular {
  id: number;
  estado: string; 
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
  informes_curriculares_asociados?: InformeCurricular[]; 
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
        
        const dataPlantilla: PlantillaInforme = await resPlantilla.json();
        setPlantilla(dataPlantilla);

        const informesAsociados = dataPlantilla.informes_curriculares_asociados || [];

        const filtrados = informesAsociados.filter(
            (i) => i.cuatrimestre_info === cuatrimestreSeleccionado
        );
        
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
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow mt-6 border">
      <h1 className="text-2xl font-bold text-center text-indigo-800 mb-2">{plantilla.titulo}</h1>
      <p className="text-center text-gray-600 italic mb-6">{plantilla.descripcion}</p>
      <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
        {plantilla.secciones.map((sec, i) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => { setActiveTab(i); setMensaje(null); }}
            className={`py-3 px-5 whitespace-nowrap font-medium transition-colors ${
              activeTab === i 
                ? "border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {sec.nombre}
          </button>
        ))}
      </div>
      {plantilla.secciones.map((sec, i) => (
        <div key={sec.id} className={activeTab === i ? "block" : "hidden"}>
          {i === 0 ? (
            <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
               <div className="space-y-4 mb-4"> 
                  {sec.preguntas.map((p) => (
                      <p key={p.id} className="font-medium text-gray-800 border-l-4 border-indigo-500 pl-3">
                          {p.texto}
                      </p>
                  ))}
                </div>
                <div className="flex items-center space-x-3 mb-6">
                  <label className="font-medium text-gray-700">Cuatrimestre:</label>
                  <select
                    className="border border-gray-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    value={cuatrimestreSeleccionado}
                    onChange={(e) => setCuatrimestreSeleccionado(e.target.value)}
                  >
                    <option value="2025 - primero">2025 - primero</option>
                    <option value="2025 - segundo">2025 - segundo</option>
                  </select>
                </div>
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-1/6 border-r border-gray-200">Código</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-2/5 border-r border-gray-200">Actividad curricular</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200">Inscriptos</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200">Com. Teóricas</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">Com. Prácticas</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {informes.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 text-center text-gray-500 italic">No hay informes para este cuatrimestre.</td></tr>
                      ) : (
                          informes.map((i) => (
                          <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-mono text-gray-600 border-r border-gray-200">{i.id}</td>
                              <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">{i.materia_nombre}</td>
                              <td className="px-4 py-3 text-center text-gray-500 border-r border-gray-200">-</td>
                              <td className="px-4 py-3 text-center text-gray-500 border-r border-gray-200">-</td>
                              <td className="px-4 py-3 text-center text-gray-500">-</td>
                          </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
          ) : i === 1 ? (
            <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
              <div className="space-y-4 mb-4">
                {sec.preguntas.map((p) => (
                  <p key={p.id} className="font-medium text-gray-800 border-l-4 border-indigo-500 pl-3">{p.texto}</p>
                ))}
              </div>
              <div className="flex items-center space-x-3 mb-6">
                <label className="font-medium text-gray-700">Filtrar Materia:</label>
                <select
                  className="border border-gray-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm max-w-xs"
                  value={informeSeleccionadoId}
                  onChange={(e) => setInformeSeleccionadoId(e.target.value)}
                >
                  <option value="todas">Todas</option>
                  {informes.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.materia_nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-2/6 border-r border-gray-200">Actividad curricular</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-2/6 border-r border-gray-200">Equipamiento e insumos</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-2/6">Bibliografía</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materiasFiltradas.length > 0 ? (
                      materiasFiltradas.map((i) => (
                        <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-indigo-900 align-top border-r border-gray-200">
                            {`${i.id} - ${i.materia_nombre}`}
                            <div className="text-xs text-gray-500 mt-1">{i.profesor_nombre}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 align-top border-r border-gray-200">{i.equipamiento || <span className="text-gray-400 italic">Sin datos</span>}</td>
                          <td className="px-4 py-3 text-gray-700 align-top">{i.bibliografia || <span className="text-gray-400 italic">Sin datos</span>}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="p-4 text-center text-gray-500">No hay informe seleccionado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : i === 2 ? (
            <div>
              {sec.preguntas.map((p) => {
                const props = {
                    materiasFiltradas,
                    respuestas,
                    handleInputChange,
                    preguntaId: p.id
                };

                if (p.texto.startsWith("2.") && !p.texto.match(/^2\.[ABC]/)) {
                  return (
                    <div key={p.id} className="mb-8">
                      <p className="font-medium mb-3 text-gray-800 border-l-4 border-indigo-500 pl-3">{p.texto}</p>
                      <Seccion2 {...props} />
                    </div>
                  );
                }
                if (p.texto.startsWith("2.A")) {
                  return (
                    <div key={p.id} className="mb-8">
                      <p className="font-medium mb-3 text-gray-800 border-l-4 border-indigo-500 pl-3">{p.texto}</p>
                      <Seccion2A {...props} />
                    </div>
                  );
                }
                if (p.texto.startsWith("2.B")) {
                  return (
                    <div key={p.id} className="mb-8">
                      <p className="font-medium mb-3 text-gray-800 border-l-4 border-indigo-500 pl-3">{p.texto}</p>
                      <Seccion2B {...props} />
                    </div>
                  );
                }
                if (p.texto.startsWith("2.C")) {
                  return (
                    <div key={p.id} className="mb-8">
                      <p className="font-medium mb-3 text-gray-800 border-l-4 border-indigo-500 pl-3">{p.texto}</p>
                      <Seccion2C {...props} />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ) : i === 3 ? (
            <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
               {sec.preguntas.map((p) => (
                 <div key={p.id} className="mb-6">
                    <p className="font-medium mb-3 text-gray-800 border-l-4 border-indigo-500 pl-3">{p.texto}</p>
                    <Seccion3
                      materiasFiltradas={materiasFiltradas}
                      respuestas={respuestas}
                      handleInputChange={handleInputChange}
                      preguntaId={p.id}
                    />
                 </div>
               ))}
            </div>
          ) : i === 4 ? (
            <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
               {sec.preguntas.map((p) => (
                 <div key={p.id} className="mb-6">
                    <p className="font-medium mb-3 text-gray-800 border-l-4 border-indigo-500 pl-3">{p.texto}</p>
                    <Seccion4
                      materiasFiltradas={materiasFiltradas}
                      respuestas={respuestas}
                      handleInputChange={handleInputChange}
                      preguntaId={p.id}
                    />
                 </div>
               ))}
            </div>
          ) : (
            sec.preguntas.map((p) => (
              <div key={p.id} className="p-6 bg-white rounded-lg border border-gray-200 mb-6 shadow-sm">
                <p className="font-medium mb-3 text-gray-800 border-l-4 border-indigo-500 pl-3">{p.texto}</p>
                {p.tipo === "REDACCION" ? (
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    rows={6} 
                    placeholder="Escriba su respuesta aquí..."
                    value={respuestas[p.id.toString()] || ""}
                    onChange={(e) => handleInputChange(p.id.toString(), e.target.value)}
                  />
                ) : (
                  <div className="space-y-2 mt-4">
                    {p.opciones?.map((op) => (
                      <label key={op.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-indigo-50 cursor-pointer transition-colors">
                        <input 
                            type="radio" 
                            name={`pregunta-${p.id}`}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                            onChange={() => handleInputChange(p.id.toString(), op.id.toString())}
                        />
                        <span className="text-gray-700">{op.texto}</span>
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
        <p className="text-center text-red-600 bg-red-100 p-3 rounded-lg mt-6 border border-red-200">{mensaje}</p>
      )}
    </div>
  );
};

export default ResponderInforme;