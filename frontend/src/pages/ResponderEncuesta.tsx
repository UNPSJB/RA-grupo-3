/*const ResponderEncuesta = () => 
<section>Aca se responderan las encuestas</section>;
export default ResponderEncuesta;*/

import React, { useState, useEffect } from "react";

interface Pregunta {
  id: number;
  texto: string;
  tipo: string;
  opciones: Opcion[];
  seccion_nombre: string;
}

interface Opcion {
  id: number;
  texto: string;
}

interface RespuestaState {
  [key: number]: string | number;
}

interface ResponderEncuestaProps {
  encuestaId: number;
}

const ResponderEncuesta: React.FC<ResponderEncuestaProps> = ({ encuestaId }) => {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<RespuestaState>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);

  // Cargar preguntas de la encuesta
  useEffect(() => {
    const cargarPreguntas = async () => {
      try {
        const response = await fetch(`http://localhost:8000/encuestas/${encuestaId}`);
        
        if (!response.ok) {
          throw new Error("Error al cargar las preguntas");
        }

        const encuestaData = await response.json();

        const todasLasPreguntas = encuestaData.secciones?.flatMap(
      (seccion: any) => seccion.preguntas?.map((pregunta: any) => ({
        ...pregunta,
        seccion_nombre: seccion.nombre
      })) || []
    ) || [];
        setPreguntas(todasLasPreguntas);
      } catch (err) {
        setError("Error al cargar la encuesta");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    cargarPreguntas();
  }, [encuestaId]);

  const handleTextoChange = (preguntaId: number, texto: string) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: texto
    }));
  };

  const handleOpcionChange = (preguntaId: number, opcionId: number) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcionId
    }));
  };

  const handleEnviarTodas = async () => {
    setEnviando(true);
    
    try {
      const respuestasArray = Object.entries(respuestas).map(([preguntaId, valor]) => ({
        pregunta_id: parseInt(preguntaId),
        texto_respuesta: typeof valor === 'string' ? valor : null,
        opcion_seleccionada_id: typeof valor === 'number' ? valor : null
      }));

      for (const respuesta of respuestasArray) {
        await fetch("http://localhost:8000/respuestas/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(respuesta),
        });
      }

      alert("¡Todas las respuestas han sido enviadas!");
      setRespuestas({});
      
    } catch (error) {
      console.error("Error al enviar respuestas:", error);
      alert("Error al enviar algunas respuestas");
    } finally {
      setEnviando(false);
    }
  };

  const handleVolver = () => {
    window.location.reload(); // Vuelve a la tabla
  };

  if (loading) return <div className="p-6 text-center">Cargando preguntas...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Responder Encuesta
        </h1>
        <button
          onClick={handleVolver}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          ← Volver
        </button>
      </div>

      <div className="space-y-6">
        {preguntas.map((pregunta, index) => (
          <div key={pregunta.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {index + 1}. {pregunta.texto}
              </h3>
              <p className="text-sm text-blue-600 mt-1">
                Sección: {pregunta.seccion_nombre}
              </p>
            </div>

            {pregunta.tipo === "REDACCION" && (
              <textarea
                value={respuestas[pregunta.id] as string || ""}
                onChange={(e) => handleTextoChange(pregunta.id, e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            )}

            {pregunta.tipo === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                {pregunta.opciones.map((opcion) => (
                  <label key={opcion.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`pregunta-${pregunta.id}`}
                      value={opcion.id}
                      checked={respuestas[pregunta.id] === opcion.id}
                      onChange={() => handleOpcionChange(pregunta.id, opcion.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{opcion.texto}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-3 text-sm">
              {respuestas[pregunta.id] ? (
                <span className="text-green-600">✓ Respondida</span>
              ) : (
                <span className="text-gray-500">⏳ Pendiente</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {preguntas.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={handleEnviarTodas}
            disabled={enviando || Object.keys(respuestas).length === 0}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {enviando ? "Enviando..." : "Enviar Todas las Respuestas"}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            {Object.keys(respuestas).length} de {preguntas.length} preguntas respondidas
          </p>
        </div>
      )}

      {preguntas.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay preguntas para responder en esta encuesta</p>
        </div>
      )}
    </div>
  );
};

export default ResponderEncuesta;