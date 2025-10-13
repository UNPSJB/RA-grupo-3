import React from "react";
import "../Styles/Styles.css";
import { useNavigate } from "react-router-dom";
import type { TipoEncuesta } from "../pages/EncuestasPage.tsx";

type Encuesta = {
  id: number;
  titulo: string;
  descripcion: string;
  anio_carrera?: number;
  cursada?: string;
  esta_completa?: boolean;
  estado: TipoEncuesta;
  preguntas: any[];
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface TablaProps {
  tipo: TipoEncuesta;
}

export function Tabla({ tipo }: TablaProps) {
  const navigate = useNavigate();
  const [data, setData] = React.useState<Encuesta[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tituloAsc, setTituloAsc] = React.useState(true);
  const [descripcionAsc, setDescripcionAsc] = React.useState(true);
  const [anioAsc, setAnioAsc] = React.useState(true);

  const sortByTitulo = () => {
    const sorted = [...data].sort((a, b) =>
      tituloAsc
        ? a.titulo.localeCompare(b.titulo)
        : b.titulo.localeCompare(a.titulo)
    );
    setData(sorted);
    setTituloAsc(!tituloAsc);
  };

  const sortByDescripcion = () => {
    const sorted = [...data].sort((a, b) =>
      descripcionAsc
        ? a.descripcion.localeCompare(b.descripcion)
        : b.descripcion.localeCompare(a.descripcion)
    );
    setData(sorted);
    setDescripcionAsc(!descripcionAsc);
  };

  const sortByAnio = () => {
    const sorted = [...data].sort((a, b) => {
      const valueA = typeof a.anio_carrera === "number" ? a.anio_carrera : null;
      const valueB = typeof b.anio_carrera === "number" ? b.anio_carrera : null;
      if (valueA === valueB) return 0;
      if (valueA === null) return anioAsc ? 1 : -1;
      if (valueB === null) return anioAsc ? -1 : 1;
      return anioAsc ? valueA - valueB : valueB - valueA;
    });
    setData(sorted);
    setAnioAsc(!anioAsc);
  };

  React.useEffect(() => {
    let isMounted = true;
    const loadEncuestas = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/encuestas/${tipo.toLowerCase()}`
        );
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const payload: Encuesta[] = await response.json();
        if (isMounted) setData(payload);
      } catch (err) {
        console.error("No se puede cargar encuestas", err);
        if (isMounted) setError("No se pudieron cargar las encuestas");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadEncuestas();
    return () => {
      isMounted = false;
    };
  }, [tipo, API_BASE_URL]);

  const handlePublicar = async (idEncuesta: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/encuestas/${idEncuesta}/publicar`,
        { method: "PATCH" }
      );
      if (!response.ok) throw new Error("Falló la publicación");
      setData((prevData) =>
        prevData.filter((encuesta) => encuesta.id !== idEncuesta)
      );
    } catch (err) {
      console.error("Error al publicar:", err);
      setError("No se pudo publicar la encuesta.");
    }
  };

  const handleBorrar = async (idEncuesta: number) => {
    if (
      !window.confirm(
        "¿Estás seguro de que quieres eliminar esta encuesta permanentemente?"
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/encuestas/${idEncuesta}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falló la eliminación");
      setData((prevData) =>
        prevData.filter((encuesta) => encuesta.id !== idEncuesta)
      );
    } catch (err) {
      console.error("Error al borrar:", err);
      setError("No se pudo eliminar la encuesta.");
    }
  };

  return (
    <div className="tabla-wrapper">
      <table className="tabla-encuestas">
        <thead>
          <tr>
            <th>
              Año
              <button
                className="btn btn--compact tabla-encuestas__sort-btn"
                onClick={sortByAnio}
              >
                {anioAsc ? "↑" : "↓"}
              </button>
            </th>
            <th>
              Titulo
              <button
                className="btn btn--compact tabla-encuestas__sort-btn"
                onClick={sortByTitulo}
              >
                {tituloAsc ? "A/Z ↑" : "Z/A ↓"}
              </button>
            </th>
            <th>
              Descripcion
              <button
                className="btn btn--compact tabla-encuestas__sort-btn"
                onClick={sortByDescripcion}
              >
                {descripcionAsc ? "A/Z ↑" : "Z/A ↓"}
              </button>
            </th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4}>Cargando encuestas...</td>
            </tr>
          )}
          {error && !loading && (
            <tr>
              <td colSpan={4}>{error}</td>
            </tr>
          )}
          {!loading && !error && data.length === 0 && (
            <tr>
              <td colSpan={4}>No hay encuestas disponibles.</td>
            </tr>
          )}
          {!loading &&
            !error &&
            data.map((item) => (
              <tr key={item.id}>
                <td>
                  {typeof item.anio_carrera === "number"
                    ? `${item.anio_carrera}°`
                    : "-"}
                </td>
                <td>{item.titulo}</td>
                <td>{item.descripcion}</td>
                <td className="tabla-encuestas__acciones">
                  {tipo === "borradores" ? (
                    <>
                      <button
                        className="tabla-encuestas__btn tabla-encuestas__btn--modificar"
                        onClick={() =>
                          navigate(`/encuestas/${item.id}/modificar`)
                        }
                      >
                        Modificar
                      </button>
                      <button
                        className="tabla-encuestas__btn tabla-encuestas__btn--publicar"
                        onClick={() => handlePublicar(item.id)}
                      >
                        Publicar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="tabla-encuestas__btn tabla-encuestas__btn--completar"
                        onClick={() =>
                          navigate(`/encuestas/${item.id}/visualizacion`)
                        }
                      >
                        Ver
                      </button>
                      <button
                        className="tabla-encuestas__btn tabla-encuestas__btn--borrar"
                        onClick={() => handleBorrar(item.id)}
                      >
                        Borrar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
