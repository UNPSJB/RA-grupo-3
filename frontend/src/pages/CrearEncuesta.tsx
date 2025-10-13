import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CrearSeccion from "./CrearSeccion";

const CrearEncuesta: React.FC = () => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [anioCarrera, setAnioCarrera] = useState<string>("1");
  const [cursada, setCursada] = useState<string>("primero");
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>("");
  const [encuestaCreada, setEncuestaCreada] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    try {
      const encuestaData = {
        titulo: titulo,
        descripcion: descripcion,
        anio_carrera: parseInt(anioCarrera),
        cursada: cursada,
      };

      const response = await fetch("http://localhost:8000/encuestas/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encuestaData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setEncuestaCreada(data.id);
      setMensaje("¡Encuesta creada exitosamente!");
    } catch (error) {
      console.error("Error al crear encuesta:", error);
      setMensaje(
        `Error: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    } finally {
      setCargando(false);
    }
  };

  const handleAgregarPreguntas = () => {
    if (encuestaCreada) {
      navigate("/encuestas/preguntas", {
        state: {
          encuestaId: encuestaCreada,
          encuestaTitulo: titulo,
          encuestaDescripcion: descripcion,
        },
      });
    }
  };

  const handleCrearOtra = () => {
    setTitulo("");
    setDescripcion("");
    setAnioCarrera("1");
    setCursada("primero");
    setEncuestaCreada(null);
    setMensaje("");
  };

/*  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Crear Nueva Encuesta
      </h2>

      {mensaje && (
        <div
          className={`p-4 mb-4 rounded-lg border ${
            mensaje.includes("Error")
              ? "bg-red-50 text-red-800 border-red-300"
              : "bg-green-50 text-green-800 border-green-300"
          }`}
        >
          {mensaje}
        </div>
      )}

      {encuestaCreada ? (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="text-center">
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
              ¡Encuesta Creada!
            </h3>

            <p className="text-gray-600">
              Título: <span className="font-semibold">{titulo}</span>
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={handleAgregarPreguntas}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Agregar Preguntas a esta Encuesta
            </button>

            <button
              onClick={handleCrearOtra}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Crear Otra Encuesta
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-lg shadow"
        >
          <div>
            <label
              htmlFor="titulo"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Título:
            </label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Encuesta 2025"
              required
            />
          </div>

          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Descripción:
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Describe el propósito de esta encuesta..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="anioCarrera"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Año de Carrera:
              </label>
              <select
                id="anioCarrera"
                value={anioCarrera}
                onChange={(e) => setAnioCarrera(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1° Año</option>
                <option value="2">2° Año</option>
                <option value="3">3° Año</option>
                <option value="4">4° Año</option>
                <option value="5">5° Año</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="cursada"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Cursada:
              </label>
              <select
                id="cursada"
                value={cursada}
                onChange={(e) => setCursada(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="primero">Primer Cuatrimestre</option>
                <option value="segundo">Segundo Cuatrimestre</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              cargando
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            } text-white`}
          >
            {cargando ? "Creando..." : "Crear Encuesta"}
          </button>
          <CrearSeccion />
        </form>
      )}
    </div>
  );
};

export default CrearEncuesta;*/

 return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Crear Nueva Encuesta
      </h2>

      {mensaje && (
        <div
          className={`p-4 mb-4 rounded-lg border ${
            mensaje.includes("Error")
              ? "bg-red-50 text-red-800 border-red-300"
              : "bg-green-50 text-green-800 border-green-300"
          }`}
        >
          {mensaje}
        </div>
      )}

      {encuestaCreada ? (
        <div className="space-y-6">
          {/* Mensaje de éxito */}
          <div className="bg-white p-6 rounded-lg shadow text-center">
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
              ¡Encuesta Creada!
            </h3>
            <p className="text-gray-600">
              Título: <span className="font-semibold">{titulo}</span>
            </p>
            <p className="text-gray-600">
              Descripción: <span className="font-semibold">{descripcion}</span>
            </p>
            <p className="text-gray-600">
              Año: <span className="font-semibold">{anioCarrera}° Año</span>
            </p>
            <p className="text-gray-600">
              Cursada: <span className="font-semibold">
                {cursada === "primero" ? "Primer Cuatrimestre" : 
                 cursada === "segundo" ? "Segundo Cuatrimestre" : "Anual"}
              </span>
            </p>
          </div>

          {/* Componente CrearSeccion */}
          <CrearSeccion encuestaId={encuestaCreada}/>

          {/* Botones de acción */}
          <div className="bg-white p-6 rounded-lg shadow space-y-3">
            <button
              onClick={handleAgregarPreguntas}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Agregar Preguntas a esta Encuesta
            </button>

            <button
              onClick={handleCrearOtra}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Crear Otra Encuesta
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-lg shadow"
        >
          <div>
            <label
              htmlFor="titulo"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Título:
            </label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Encuesta 2025"
              required
            />
          </div>

          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Descripción:
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Describe el propósito de esta encuesta..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="anioCarrera"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Año de Carrera:
              </label>
              <select
                id="anioCarrera"
                value={anioCarrera}
                onChange={(e) => setAnioCarrera(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1° Año</option>
                <option value="2">2° Año</option>
                <option value="3">3° Año</option>
                <option value="4">4° Año</option>
                <option value="5">5° Año</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="cursada"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Cursada:
              </label>
              <select
                id="cursada"
                value={cursada}
                onChange={(e) => setCursada(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="primero">Primer Cuatrimestre</option>
                <option value="segundo">Segundo Cuatrimestre</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              cargando
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            } text-white`}
          >
            {cargando ? "Creando..." : "Crear Encuesta"}
          </button>
        </form>
      )}
    </div>
  );
};

export default CrearEncuesta;