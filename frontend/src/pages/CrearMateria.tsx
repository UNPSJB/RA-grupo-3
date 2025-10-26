// src/pages/CrearMateria.tsx

import React, { useState } from "react";

const CrearMateria: React.FC = () => {
  const [nombre, setNombre] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");

  const [cargando, setCargando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>("");
  const [materiaCreada, setMateriaCreada] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");
    setMateriaCreada(null);

    try {
      const materiaData = {
        nombre: nombre,
        descripcion: descripcion,
      };

      const response = await fetch("http://localhost:8000/materias/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(materiaData),
      });

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
      setMateriaCreada({ id: data.id, nombre: data.nombre });
      setMensaje(`¡Materia "${data.nombre}" creada exitosamente!`);

      setNombre("");
      setDescripcion("");
    } catch (error) {
      console.error("Error al crear materia:", error);

      setMensaje(
        `Error al crear materia: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">
        Crear Nueva Materia
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
          {materiaCreada && !mensaje.includes("Error") && (
            <p className="text-sm mt-1 text-gray-600">
              ID asignado: {materiaCreada.id}
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-8 rounded-lg shadow border border-gray-200"
      >
        <div>
          <label
            htmlFor="nombre"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre de la Materia:
          </label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out"
            placeholder="Ej: Cálculo Avanzado"
            required
          />
        </div>

        <div>
          <label
            htmlFor="descripcion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Descripción:
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out"
            rows={3}
            placeholder="Describe brevemente los contenidos o el propósito de la materia..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-150 ease-in-out ${
            cargando
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" // Estilo normal
          }`}
        >
          {cargando ? "Creando Materia..." : "Crear Materia"}
        </button>
      </form>
    </div>
  );
};

export default CrearMateria;
