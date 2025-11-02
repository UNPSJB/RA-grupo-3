import React from "react";

import { useNavigate } from "react-router-dom";

type PlantillaEncuesta = {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string; // "BORRADOR" | "PUBLICADA"
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type TipoTabla = "borradores" | "publicadas";
interface TablaProps {
  tipo: TipoTabla;
}

export function Tabla({ tipo }: TablaProps) {
  const navigate = useNavigate();
  const [data, setData] = React.useState<PlantillaEncuesta[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tituloAsc, setTituloAsc] = React.useState(true);
  const [descripcionAsc, setDescripcionAsc] = React.useState(true);

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

  React.useEffect(() => {
    console.log(`Tabla useEffect ejecutándose para tipo: ${tipo}`);
    let isMounted = true;
    const loadPlantillas = async () => {
      setLoading(true);
      setError(null);
      setData([]);
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/plantillas-encuesta/${tipo.toLowerCase()}`
        );
        if (!response.ok) {
          let errorDetail = response.statusText;
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) {}
          throw new Error(`Error ${response.status}: ${errorDetail}`);
        }
        const payload: PlantillaEncuesta[] = await response.json();
        if (isMounted) setData(payload);
      } catch (err) {
        console.error(`No se pudo cargar ${tipo}`, err);
        if (isMounted) setError(`No se pudieron cargar las plantillas ${tipo}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPlantillas();
    return () => {
      isMounted = false;
    };
  }, [tipo]);

  const handlePublicar = async (plantillaId: number) => {
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/plantillas-encuesta/${plantillaId}/publicar`,
        { method: "PATCH" }
      );
      if (!response.ok) throw new Error("Falló la publicación");
      setData((prevData) =>
        prevData.filter((encuesta) => encuesta.id !== plantillaId)
      );
    } catch (err) {
      console.error("Error al publicar:", err);
      setError("No se pudo publicar la encuesta.");
    }
  };

  const handleBorrar = async (plantillaId: number) => {
    if (
      !window.confirm(
        "¿Estás seguro de que quieres eliminar esta encuesta permanentemente?"
      )
    ) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/plantillas-encuesta/${plantillaId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Falló la eliminación");
      setData((prevData) =>
        prevData.filter((encuesta) => encuesta.id !== plantillaId)
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
              Titulo
              <button onClick={sortByTitulo}>
                {tituloAsc ? "A/Z ↑" : "Z/A ↓"}
              </button>
            </th>
            <th>
              Descripcion
              <button onClick={sortByDescripcion}>
                {descripcionAsc ? "A/Z ↑" : "Z/A ↓"}
              </button>
            </th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={3}>Cargando plantillas...</td>
            </tr>
          )}
          {error && !loading && (
            <tr className="text-red-600">
              <td colSpan={3}>{error}</td>
            </tr>
          )}
          {!loading && !error && data.length === 0 && (
            <tr>
              <td colSpan={3}>No hay plantillas disponibles.</td>{" "}
            </tr>
          )}
          {!loading &&
            !error &&
            data.map((item) => (
              <tr key={item.id}>
                <td>{item.titulo}</td>
                <td>{item.descripcion}</td>
                <td className="tabla-encuestas__acciones">
                  {tipo === "borradores" ? (
                    <>
                      <button
                        className="tabla-encuestas__btn tabla-encuestas__btn--modificar"
                        onClick={() =>
                          navigate(
                            `/admin/plantillas-encuesta/${item.id}/modificar`
                          )
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
                      <button
                        className="tabla-encuestas__btn tabla-encuestas__btn--borrar"
                        onClick={() => handleBorrar(item.id)}
                      >
                        Borrar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="tabla-encuestas__btn tabla-encuestas__btn--completar"
                        onClick={() =>
                          navigate(
                            `/admin/plantillas-encuesta/${item.id}/visualizacion`
                          )
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
