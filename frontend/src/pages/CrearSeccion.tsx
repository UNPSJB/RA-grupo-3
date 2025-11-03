import { useState, type FormEvent, type ChangeEvent } from "react";
import CrearPregunta from "./CrearPregunta";

interface Seccion {
  id: number;
  nombre: string;
}

interface CrearSeccionProps {
  instrumentoId: number;
}

function CrearSeccion({ instrumentoId }: CrearSeccionProps) {
  const [nombre, setNombre] = useState<string>("");
  const [mensaje, setMensaje] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(false);
  const [seccionCreada, setSeccionCreada] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    try {
      const seccionData = {
        nombre: nombre,
        instrumento_id: instrumentoId,
      };

      const respuesta = await fetch("http://127.0.0.1:8000/secciones/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(seccionData),
      });

      if (!respuesta.ok) {
        throw new Error("Error al crear la sección");
      }

      const data: Seccion = await respuesta.json();
      setMensaje(`Sección creada con ID: ${data.id}`);
      setSeccionCreada(data.id);
    } catch (error) {
      console.error(error);
      setMensaje("Error al crear la sección");
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNombre(e.target.value);
  };

  const handleCrearOtraSeccion = () => {
    setSeccionCreada(null);
    setMensaje("");
    setNombre("");
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Crear Sección
      </h2>

      {mensaje && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "5px",
            textAlign: "center",
            backgroundColor: mensaje.includes("Error") ? "#f8d7da" : "#d1edff",
            color: mensaje.includes("Error") ? "#721c24" : "#155724",
            border: `1px solid ${
              mensaje.includes("Error") ? "#f5c6cb" : "#c3e6cb"
            }`,
          }}
        >
          {mensaje}
        </div>
      )}

      {seccionCreada ? (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ color: "green", marginBottom: "10px" }}>
              ✓ Sección Creada Exitosamente
            </h3>
            <p style={{ marginBottom: "15px" }}>
              <strong>Nombre:</strong> {nombre}
            </p>
            <button
              onClick={handleCrearOtraSeccion}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Crear Otra Sección
            </button>
          </div>

          {/* Componente CrearPregunta */}
          <CrearPregunta seccionId={seccionCreada} seccionNombre={nombre} />
        </div>
      ) : (
        <div
          style={{
            maxWidth: "400px",
            margin: "0 auto",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "10px",
          }}
        >
          <form onSubmit={handleSubmit}>
            <label htmlFor="nombre">Nombre de la sección:</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={handleChange}
              placeholder="Ej: Preguntas generales"
              required
              style={{
                width: "100%",
                padding: "8px",
                margin: "10px 0",
                borderRadius: "5px",
                border: "1px solid #aaa",
              }}
            />

            <button
              type="submit"
              disabled={cargando}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: cargando ? "#777" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: cargando ? "not-allowed" : "pointer",
              }}
            >
              {cargando ? "Creando..." : "Crear Sección"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default CrearSeccion;
