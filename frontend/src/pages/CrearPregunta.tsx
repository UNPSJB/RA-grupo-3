import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CrearPregunta: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Recibo datos de la encuesta desde el state de navegación
  const { encuestaId, encuestaTitulo, encuestaDescripcion } =
    location.state || {};

  const [texto, setTexto] = useState<string>("");
  const [tipo, setTipo] = useState<string>("MULTIPLE_CHOICE");
  const [opciones, setOpciones] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [preguntasCreadas, setPreguntasCreadas] = useState<number>(0);

  // Redirigimos si no hay datos de encuesta
  useEffect(() => {
    if (!encuestaId) {
      navigate("/crearEncuesta");
    }
  }, [encuestaId, navigate]);

  const handleAgregarOpcion = () => {
    setOpciones([...opciones, ""]);
  };

  const handleEliminarOpcion = (index: number) => {
    if (opciones.length > 2) {
      setOpciones(opciones.filter((_, i) => i !== index));
    }
  };

  const handleOpcionChange = (index: number, value: string) => {
    const nuevasOpciones = [...opciones];
    nuevasOpciones[index] = value;
    setOpciones(nuevasOpciones);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    //console.log("encuestaId:", encuestaId);
    //console.log("tipo de encuestaId:", typeof encuestaId);

    try {
      const preguntaData = {
        texto: texto,
        tipo: tipo,
        encuesta_id: encuestaId ? parseInt(encuestaId.toString()) : 0,
        opciones:
          tipo === "MULTIPLE_CHOICE"
            ? opciones
                .filter((op) => op.trim() !== "")
                .map((op) => ({ texto: op }))
            : null,
      };

      const response = await fetch("http://localhost:8000/preguntas/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preguntaData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Limpiar formulario después de enviar
      setTexto("");
      setTipo("MULTIPLE_CHOICE");
      setOpciones(["", ""]);
      setPreguntasCreadas(preguntasCreadas + 1);
      setMessage("¡Pregunta creada exitosamente!");

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error al crear pregunta:", error);
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = () => {
    navigate("/encuestas");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Crear Nueva Pregunta
        </h2>
        {encuestaTitulo && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">
              Para la encuesta:
            </p>
            <h3 className="text-lg font-bold text-blue-900">
              {encuestaTitulo}
            </h3>
            {encuestaDescripcion && (
              <p className="text-sm text-blue-700 mt-1">
                {encuestaDescripcion}
              </p>
            )}
            {preguntasCreadas > 0 && (
              <p className="text-sm text-green-700 mt-2 font-medium">
                ✓ {preguntasCreadas} pregunta{preguntasCreadas !== 1 ? "s" : ""}{" "}
                agregada{preguntasCreadas !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 mb-4 rounded-lg border ${
            message.includes("Error")
              ? "bg-red-50 text-red-800 border-red-300"
              : "bg-green-50 text-green-800 border-green-300"
          }`}
        >
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow"
      >
        <div>
          <label
            htmlFor="texto"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Texto de la Pregunta:
          </label>
          <textarea
            id="texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Escriba la pregunta"
            //minLength={5} //no deberia haber minimo no?
            maxLength={500}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {texto.length}/500 caracteres
          </p>
        </div>

        <div>
          <label
            htmlFor="tipo"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tipo de Pregunta:
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="MULTIPLE_CHOICE">Opción Múltiple</option>
            <option value="REDACCION">Redacción</option>
          </select>
        </div>

        {tipo === "MULTIPLE_CHOICE" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opciones de Respuesta:
            </label>
            <div className="space-y-3">
              {opciones.map((opcion, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={opcion}
                    onChange={(e) => handleOpcionChange(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    maxLength={255}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {opciones.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarOpcion(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAgregarOpcion}
              className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              + Agregar Opción
            </button>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            } text-white`}
          >
            {loading ? "Creando..." : "Crear Pregunta"}
          </button>

          {preguntasCreadas > 0 && (
            <button
              type="button"
              onClick={handleFinalizar}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Finalizar
            </button>
          )}
        </div>
      </form>

      {preguntasCreadas > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Puedes seguir agregando más preguntas o
            presionar "Finalizar" cuando termines.
          </p>
        </div>
      )}
    </div>
  );
};

export default CrearPregunta;
