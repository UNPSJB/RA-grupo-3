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

interface PlantillaEncuesta {
  id: number;
  titulo: string;
  descripcion?: string;
  secciones: Seccion[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ResponderEncuesta: React.FC = () => {
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const navigate = useNavigate();

  const [plantilla, setPlantilla] = useState<PlantillaEncuesta | null>(null);
  const [respuestas, setRespuestas] = useState<{
    [preguntaId: number]: string | number;
  }>({});

  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [encuestaCompletada, setEncuestaCompletada] = useState(false);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPlantillaParaInstancia = async () => {
      setLoading(true);
      setMensaje(null);
      setPlantilla(null);

      if (!instanciaId || isNaN(Number(instanciaId))) {
        setMensaje("ID de instancia inválido en la URL.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/encuestas-abiertas/instancia/${instanciaId}/detalles`
        );

        if (!response.ok) {
          let errorDetail = `Error ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) {}
          if (response.status === 404) {
            setMensaje(
              "La encuesta solicitada no se encontró o ya no está activa."
            );
          } else {
            setMensaje(errorDetail);
          }
          throw new Error(errorDetail);
        }
        const plantillaData: PlantillaEncuesta = await response.json();

        if (isMounted) {
          setPlantilla(plantillaData);
        }
      } catch (error) {
        console.error("Error al obtener la plantilla de la encuesta:", error);
        if (isMounted && !mensaje) {
          setMensaje(
            `Error al cargar la encuesta: ${
              error instanceof Error ? error.message : "Error desconocido"
            }`
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPlantillaParaInstancia();

    return () => {
      isMounted = false;
    };
  }, [instanciaId]);

  const manejarCambio = (preguntaId: number, valor: string | number) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanciaId) return;

    setCargandoEnvio(true);
    setMensaje(null);

    const payload = {
      respuestas: Object.entries(respuestas).map(([preguntaId, valor]) => ({
        pregunta_id: Number(preguntaId),
        opcion_id: typeof valor === "number" ? valor : undefined,
        texto: typeof valor === "string" ? valor : undefined,
      })),
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/encuestas-abiertas/instancia/${instanciaId}/responder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let errorDetail = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch (e) {}
        throw new Error(errorDetail);
      }

      setMensaje("¡Respuestas enviadas correctamente!");
      setEncuestaCompletada(true);
    } catch (error) {
      console.error("Error al enviar respuestas:", error);
      setMensaje(
        `Error al enviar respuestas: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setCargandoEnvio(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-8 animate-pulse text-gray-500">
        Cargando encuesta...
      </p>
    );

  if (mensaje && mensaje.toLowerCase().includes("error")) {
    return (
      <p className="text-center mt-8 text-red-600 bg-red-100 p-4 rounded border border-red-300">
        Error: {mensaje}
      </p>
    );
  }
  if (!plantilla)
    return (
      <p className="text-center mt-8 text-orange-600">
        No se encontró la información de la encuesta.
      </p>
    );

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
            ¡Respuestas enviadas correctamente!
          </h3>
          <p className="text-gray-600 mb-4">
            Gracias por completar la encuesta.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/encuestas-activas")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Ver mis encuestas
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
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md mt-6 mb-8 border border-gray-200">
      <h1 className="text-2xl font-bold mb-2 text-center text-indigo-800">
        {plantilla.titulo}
      </h1>
      {plantilla.descripcion && (
        <p className="text-sm text-gray-500 mb-6 text-center">
          {plantilla.descripcion}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {plantilla.secciones.map((seccion) => (
          <div key={seccion.id} className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {seccion.nombre}
            </h2>
            <div className="space-y-5">
              {seccion.preguntas.map((pregunta) => {
                const tipo = pregunta.tipo;
                const esRedaccion = tipo === "REDACCION";
                const esMultipleChoice = tipo === "MULTIPLE_CHOICE";

                return (
                  <div
                    key={pregunta.id}
                    className="p-4 bg-gray-50 rounded-md border border-gray-100"
                  >
                    <p className="font-medium mb-3 text-gray-800">
                      {pregunta.texto}
                    </p>

                    {esRedaccion ? (
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                        placeholder="Escribe tu respuesta..."
                        rows={3}
                        value={String(respuestas[pregunta.id] ?? "")}
                        onChange={(e) =>
                          manejarCambio(pregunta.id, e.target.value)
                        }
                        required
                      />
                    ) : esMultipleChoice ? (
                      <div className="space-y-2">
                        {pregunta.opciones.map((opcion) => (
                          <label
                            key={opcion.id}
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-indigo-50 transition-colors"
                          >
                            <input
                              type="radio"
                              name={`pregunta-${pregunta.id}`}
                              value={opcion.id}
                              checked={
                                Number(respuestas[pregunta.id]) === opcion.id
                              }
                              onChange={() =>
                                manejarCambio(pregunta.id, opcion.id)
                              }
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              required
                            />
                            <span className="text-gray-700">
                              {opcion.texto}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-500 text-sm italic">
                        Tipo de pregunta no soportado: {pregunta.tipo}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {mensaje && (
          <p
            className={`text-center font-medium p-3 rounded border ${
              mensaje.includes("Error")
                ? "text-red-700 bg-red-100 border-red-300"
                : "text-green-700 bg-green-100 border-green-300"
            }`}
          >
            {mensaje}
          </p>
        )}
        <div className="text-center pt-4">
          <button
            type="submit"
            disabled={cargandoEnvio}
            className={`bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cargandoEnvio ? "Enviando Respuestas..." : "Finalizar y Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResponderEncuesta;
