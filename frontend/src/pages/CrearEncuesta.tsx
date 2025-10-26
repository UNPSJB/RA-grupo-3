import React, { useState } from "react";
import CrearSeccion from "./CrearSeccion";

const CrearEncuesta: React.FC = () => {
  // Estado para título y descripción (¡solo datos de la plantilla!)
  const [titulo, setTitulo] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  // Estado para el flujo de la UI
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>("");
  const [plantillaCreadaId, setPlantillaCreadaId] = useState<number | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    try {
      // Datos a enviar: solo título y descripción
      const plantillaData = {
        titulo: titulo,
        descripcion: descripcion,
        // El estado 'BORRADOR' lo pone el backend por defecto
      };

      // Endpoint correcto para crear plantillas
      const response = await fetch(
        "http://localhost:8000/admin/plantillas-encuesta/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(plantillaData),
        }
      );

      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch (jsonError) {}
        throw new Error(
          `Error ${response.status}: ${
            errorData?.detail || response.statusText
          }`
        );
      }

      const data = await response.json();
      setPlantillaCreadaId(data.id);
      setMensaje("¡Plantilla de Encuesta creada exitosamente!");
    } catch (error) {
      console.error("Error al crear plantilla:", error);
      setMensaje(
        `Error al crear plantilla: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setCargando(false);
    }
  };

  const handleCrearOtra = () => {
    setTitulo("");
    setDescripcion("");
    setPlantillaCreadaId(null);
    setMensaje("");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">
        Crear Nueva Plantilla de Encuesta
      </h2>

      {mensaje && (
        <div
          className={`p-4 mb-6 rounded-lg border text-center ${
            mensaje.includes("Error")
              ? "bg-red-50 text-red-700 border-red-300"
              : "bg-green-50 text-green-700 border-green-300"
          }`}
        >
          {mensaje}
        </div>
      )}

      {plantillaCreadaId ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow text-center border border-gray-200">
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
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Plantilla Creada (ID: {plantillaCreadaId})
            </h3>
            <p className="text-gray-600 mb-1">
              Título:{" "}
              <span className="font-medium text-gray-800">{titulo}</span>
            </p>
            <p className="text-gray-600">
              Descripción:{" "}
              <span className="font-medium text-gray-800">{descripcion}</span>
            </p>
          </div>

          <CrearSeccion encuestaId={plantillaCreadaId} />

          <button
            onClick={handleCrearOtra}
            className="w-full px-6 py-3 mt-4 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Crear Otra Plantilla
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-8 rounded-lg shadow border border-gray-200"
        >
          {/* Campo Título */}
          <div>
            <label
              htmlFor="titulo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Título de la Plantilla:
            </label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Ej: Encuesta Fin de Cursada 1er Año"
              required
            />
          </div>

          {/* Campo Descripción */}
          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Descripción de la Plantilla:
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out"
              rows={4}
              placeholder="Describe cuándo o para qué se usará esta plantilla..."
              required
            />
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={cargando}
            className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-150 ease-in-out ${
              cargando
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            }`}
          >
            {cargando
              ? "Creando Plantilla..."
              : "Crear Plantilla y Añadir Secciones"}
          </button>
        </form>
      )}
    </div>
  );
};

export default CrearEncuesta;
