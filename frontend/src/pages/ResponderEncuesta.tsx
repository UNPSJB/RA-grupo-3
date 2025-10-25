import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Opcion {
  id: number;
  texto: string;
}

interface Pregunta {
  id: number;
  texto: string;
  tipo: string;
  opciones: Opcion[];
}

interface Seccion {
  id: number;
  nombre: string;
  preguntas: Pregunta[];
}

interface Encuesta {
  id: number;
  titulo: string;
  secciones: Seccion[];
}

const ResponderEncuesta: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [encuesta, setEncuesta] = useState<Encuesta | null>(null);
  const [respuestas, setRespuestas] = useState<{ [preguntaId: number]: string | number }>({});
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [encuestaCompletada, setEncuestaCompletada] = useState(false);
  const [cargando, setCargando] = useState(false);

  
  useEffect(() => {
    const fetchEncuesta = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/encuestas/${id}/completa`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setEncuesta(data);
      } catch (error) {
        console.error("Error al obtener la encuesta:", error);
        setMensaje(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`);
      } finally {
        setLoading(false);
      }
    };
    fetchEncuesta();
  }, [id]);

  const manejarCambio = (preguntaId: number, valor: string | number) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    const payload = {
      respuestas: Object.entries(respuestas).map(([preguntaId, valor]) => ({
        pregunta_id: Number(preguntaId),
        opcion_id: typeof valor === "number" ? valor : null,
        texto: typeof valor === "string" ? valor : null,
      })),
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/respuestas/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      setMensaje("Encuesta completada");
      setEncuestaCompletada(true);
    } catch (error) {
      console.error("Error al enviar respuestas:", error);
      setMensaje(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setCargando(false);
    }
  };

  if (loading) return <p className="text-center mt-8">Cargando encuesta...</p>;
  if (!encuesta) return <p className="text-center mt-8 text-red-600">Encuesta no encontrada.</p>;

  
  if (encuestaCompletada) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            ¡Encuesta completada correctamente!
          </h3>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/encuestas/completar")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Completar otra encuesta
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md mt-6">
      <h1 className="text-2xl font-bold mb-6 text-center">{encuesta.titulo}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {encuesta.secciones.map((seccion) => (
          <div key={seccion.id} className="mb-6">
            <h2 className="text-xl font-semibold mb-3 border-b pb-1">
              {seccion.nombre}
            </h2>

            {seccion.preguntas.map((pregunta) => {
              const tipo = pregunta.tipo.trim().toUpperCase();
              const esRedaccion = tipo === "REDACCION";
              const esMultipleChoice = tipo === "MULTIPLE_CHOICE";


              return (
                <div key={pregunta.id} className="mb-4">
                  <p className="font-medium mb-2">{pregunta.texto}</p>

                  {esRedaccion ? (
                    <textarea
                      className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Escribí tu respuesta..."
                      value={typeof respuestas[pregunta.id] === "string" ? (respuestas[pregunta.id] as string) : ""}
                      onChange={(e) => manejarCambio(pregunta.id, e.target.value)}
                    />
                  ) : esMultipleChoice ? (
                    <div className="space-y-1">
                      {pregunta.opciones.map((opcion) => (
                        <label key={opcion.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`pregunta-${pregunta.id}`}
                            value={opcion.id}
                            checked={respuestas[pregunta.id] === opcion.id}
                            onChange={() => manejarCambio(pregunta.id, opcion.id)}
                          />
                          <span>{opcion.texto}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      Tipo de pregunta no reconocido: {pregunta.tipo}
                    </p>
                  )}

                </div>
              );
            })}
          </div>
        ))}

        {mensaje && (
          <p
            className={`text-center font-medium ${
              mensaje.includes("Error") ? "text-red-600" : "text-green-600"
            }`}
          >
            {mensaje}
          </p>
        )}

        <div className="text-center mt-6">
          <button
            type="submit"
            disabled={cargando}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {cargando ? "Enviando..." : "Terminar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResponderEncuesta;
