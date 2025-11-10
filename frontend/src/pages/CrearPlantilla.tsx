import React, { useState, useMemo } from "react";

// Tipos de datos
type Opcion = {
  id: number;
  texto: string;
};

type Pregunta = {
  id: number;
  texto: string;
  tipo: "REDACCION" | "MULTIPLE_CHOICE";
  opciones: Opcion[];
};

type Seccion = {
  id: number;
  titulo: string;
  preguntas: Pregunta[];
};

const CrearPlantilla: React.FC = () => {
  const [titulo, setTitulo] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>("");

  const isFormValid = useMemo(() => {
    if (!titulo.trim() || !descripcion.trim() || !tipo) {
      return false;
    }
    if (secciones.length === 0) {
      return false;
    }
    for (const seccion of secciones) {
      if (!seccion.titulo.trim()) {
        return false;
      }
      if (seccion.preguntas.length === 0) {
        return false;
      }
      for (const pregunta of seccion.preguntas) {
        if (!pregunta.texto.trim()) {
          return false;
        }
        if (pregunta.tipo === "MULTIPLE_CHOICE") {
          if (pregunta.opciones.length === 0) {
            return false;
          }
          for (const opcion of pregunta.opciones) {
            if (!opcion.texto.trim()) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }, [titulo, descripcion, tipo, secciones]);

  // --- MANEJO DE SECCIONES ---
  const agregarSeccion = () => {
    const nuevaSeccion: Seccion = {
      id: Date.now(),
      titulo: `Nueva Sección ${secciones.length + 1}`,
      preguntas: [],
    };
    setSecciones([...secciones, nuevaSeccion]);
    setActiveAccordion(nuevaSeccion.id); // Abrir la nueva sección
  };

  const handleSeccionTituloChange = (seccionId: number, nuevoTitulo: string) => {
    setSecciones(
      secciones.map((s) =>
        s.id === seccionId ? { ...s, titulo: nuevoTitulo } : s
      )
    );
  };

  const removerSeccion = (seccionId: number) => {
    setSecciones(secciones.filter((s) => s.id !== seccionId));
  };

  // --- MANEJO DE PREGUNTAS ---
  const agregarPregunta = (seccionId: number) => {
    const nuevaPregunta: Pregunta = {
      id: Date.now(),
      texto: "",
      tipo: "REDACCION",
      opciones: [],
    };
    setSecciones(
      secciones.map((s) =>
        s.id === seccionId
          ? { ...s, preguntas: [...s.preguntas, nuevaPregunta] }
          : s
      )
    );
  };

  const handlePreguntaChange = (
    seccionId: number,
    preguntaId: number,
    updates: Partial<Pregunta>
  ) => {
    setSecciones(
      secciones.map((s) =>
        s.id === seccionId
          ? {
              ...s,
              preguntas: s.preguntas.map((p) =>
                p.id === preguntaId ? { ...p, ...updates } : p
              ),
            }
          : s
      )
    );
  };

  // --- MANEJO DE OPCIONES (PARA MULTIPLE_CHOICE) ---
  const agregarOpcion = (seccionId: number, preguntaId: number) => {
    const nuevaOpcion: Opcion = {
      id: Date.now(),
      texto: "",
    };
    setSecciones(
      secciones.map((s) =>
        s.id === seccionId
          ? {
              ...s,
              preguntas: s.preguntas.map((p) =>
                p.id === preguntaId
                  ? { ...p, opciones: [...p.opciones, nuevaOpcion] }
                  : p
              ),
            }
          : s
      )
    );
  };

  const handleOpcionChange = (
    seccionId: number,
    preguntaId: number,
    opcionId: number,
    texto: string
  ) => {
    setSecciones(
      secciones.map((s) =>
        s.id === seccionId
          ? {
              ...s,
              preguntas: s.preguntas.map((p) =>
                p.id === preguntaId
                  ? {
                      ...p,
                      opciones: p.opciones.map((o) =>
                        o.id === opcionId ? { ...o, texto } : o
                      ),
                    }
                  : p
              ),
            }
          : s
      )
    );
  };

  const removerOpcion = (seccionId: number, preguntaId: number, opcionId: number) => {
    setSecciones(
      secciones.map((s) =>
        s.id === seccionId
          ? {
              ...s,
              preguntas: s.preguntas.map((p) =>
                p.id === preguntaId
                  ? {
                      ...p,
                      opciones: p.opciones.filter((o) => o.id !== opcionId),
                    }
                  : p
              ),
            }
          : s
      )
    );
  };

  const toggleAccordion = (seccionId: number) => {
    setActiveAccordion(activeAccordion === seccionId ? null : seccionId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    const delay = new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const payload = {
        titulo,
        descripcion,
        tipo,
        secciones: secciones.map((s) => ({
          titulo: s.titulo,
          preguntas: s.preguntas.map((p) => ({
            texto: p.texto,
            tipo: p.tipo,
            opciones: p.opciones.map((o) => ({ texto: o.texto })),
          })),
        })),
      };

      const apiCall = fetch(
        "http://localhost:8000/admin/instrumentos/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      ).then(async (response) => {
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
        return response.json();
      });

      await Promise.all([apiCall, delay]);

      setMensaje("¡Plantilla creada exitosamente!");
    } catch (error) {
      console.error("Error al crear plantilla:", error);
      setMensaje(
        `Error al crear plantilla: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setCargando(false);
      window.scrollTo(0, 0);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Creacion de Plantillas
      </h1>

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

      {/* --- TÍTULO Y DESCRIPCIÓN DE LA PLANTILLA --- */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="mb-4">
          <label
            htmlFor="titulo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Título
          </label>
          <input
            type="text"
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Ej: Encuesta de Satisfacción"
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="descripcion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Descripción
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Describe el propósito de esta plantilla..."
            required
          />
        </div>
        <div>
            <label
              htmlFor="tipo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tipo de Plantilla:
            </label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="" disabled>
                {" "}
                -- Seleccione un tipo --{" "}
              </option>
              <option value="ENCUESTA">Encuesta de Alumno</option>
              <option value="ACTIVIDAD_CURRICULAR">Actividad Curricular</option>
              <option value="INFORME_SINTETICO">Informe Sintético</option>
            </select>
          </div>
      </form>

      {/* --- BOTÓN PARA AGREGAR SECCIONES --- */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={agregarSeccion}
          className="w-1/2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          + Agregar Sección
        </button>
      </div>

      {/* --- ACORDEÓN DE SECCIONES --- */}
      <div className="space-y-2">
        {secciones.map((seccion) => (
          <div key={seccion.id} className="border rounded-lg overflow-hidden">
            {/* --- CABECERA DEL ACORDEÓN --- */}
            <div className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200">
              <button
                onClick={() => toggleAccordion(seccion.id)}
                className="flex-grow flex items-center text-left"
              >
                <input
                  type="text"
                  value={seccion.titulo}
                  onChange={(e) => handleSeccionTituloChange(seccion.id, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 flex-grow"
                  onClick={(e) => e.stopPropagation()} // Evita que el acordeón se cierre al hacer clic
                />
                <span className={`ml-4 transform transition-transform ${activeAccordion === seccion.id ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              <button
                onClick={() => removerSeccion(seccion.id)}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                &#x2715;
              </button>
            </div>

            {/* --- CONTENIDO DEL ACORDEÓN (PREGUNTAS) --- */}
            {activeAccordion === seccion.id && (
              <div className="p-4 bg-white">
                {seccion.preguntas.map((pregunta) => (
                  <div key={pregunta.id} className="mb-4 p-4 border rounded-md">
                    <textarea
                      value={pregunta.texto}
                      onChange={(e) =>
                        handlePreguntaChange(seccion.id, pregunta.id, {
                          texto: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Escribe tu pregunta aquí..."
                    />
                    <select
                      value={pregunta.tipo}
                      onChange={(e) =>
                        handlePreguntaChange(seccion.id, pregunta.id, {
                          tipo: e.target.value as "REDACCION" | "MULTIPLE_CHOICE",
                        })
                      }
                      className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="REDACCION">Redacción</option>
                      <option value="MULTIPLE_CHOICE">Opción Múltiple</option>
                    </select>

                    {/* --- OPCIONES PARA MULTIPLE_CHOICE --- */}
                    {pregunta.tipo === "MULTIPLE_CHOICE" && (
                      <div className="mt-2 pl-4">
                        {pregunta.opciones.map((opcion) => (
                          <div key={opcion.id} className="flex items-center mt-1">
                            <input
                              type="text"
                              value={opcion.texto}
                              onChange={(e) =>
                                handleOpcionChange(
                                  seccion.id,
                                  pregunta.id,
                                  opcion.id,
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              placeholder="Texto de la opción"
                            />
                            <button
                              onClick={() => removerOpcion(seccion.id, pregunta.id, opcion.id)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              &#x2715;
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => agregarOpcion(seccion.id, pregunta.id)}
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          + Agregar Opción
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => agregarPregunta(seccion.id)}
                  className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  + Agregar Pregunta
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={cargando || !isFormValid}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-150 ease-in-out ${
            cargando || !isFormValid
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}>
          {cargando ? "Creando Plantilla..." : "Crear Plantilla"}
        </button>
      </div>

    </div>
  );
};

export default CrearPlantilla;
