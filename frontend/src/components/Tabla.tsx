import React from "react";
import "../Styles/Styles.css";
import { useNavigate } from "react-router-dom";

type TipoInstrumento =
  | "ENCUESTA"
  | "ACTIVIDAD_CURRICULAR"
  | "INFORME_SINTETICO";

interface Plantilla {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: TipoInstrumento;
  estado: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type TipoTabla = "borradores" | "publicadas";
interface TablaProps {
  tipo: TipoTabla;
}

function formatearTipo(tipo: TipoInstrumento) {
  switch (tipo) {
    case "ENCUESTA":
      return "Encuesta de Alumno";
    case "ACTIVIDAD_CURRICULAR":
      return "Informe Curricular";
    case "INFORME_SINTETICO":
      return "Informe Sintético";
    default:
      return tipo;
  }
}

export function Tabla({ tipo }: TablaProps) {
  const navigate = useNavigate();
  const [data, setData] = React.useState<Plantilla[]>([]);
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
          `${API_BASE_URL}/admin/instrumentos/${tipo.toLowerCase()}`
        );
        if (!response.ok) {
          let errorDetail = response.statusText;
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) {}
          throw new Error(`Error ${response.status}: ${errorDetail}`);
        }
        const payload: Plantilla[] = await response.json();
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
        `${API_BASE_URL}/admin/instrumentos/${plantillaId}/publicar`,
        { method: "PATCH" }
      );
      if (!response.ok) throw new Error("Falló la publicación");
      setData((prevData) =>
        prevData.filter((plantilla) => plantilla.id !== plantillaId)
      );
    } catch (err) {
      console.error("Error al publicar:", err);
      setError("No se pudo publicar la plantilla.");
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
        `${API_BASE_URL}/admin/instrumentos/${plantillaId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Falló la eliminación");
      setData((prevData) =>
        prevData.filter((plantilla) => plantilla.id !== plantillaId)
      );
    } catch (err) {
      console.error("Error al borrar:", err);
      setError("No se pudo eliminar la plantilla.");
    }
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {/* 👇 CAMBIO: Añadir onClick para ordenar */}
          <th
            className="px-6 py-3 text-left ... cursor-pointer"
            onClick={sortByTitulo}
          >
            Título {tituloAsc ? "🔼" : "🔽"}
          </th>

          {/* 👇 CAMBIO: Añadir onClick para ordenar */}
          <th
            className="px-6 py-3 text-left ... cursor-pointer"
            onClick={sortByDescripcion}
          >
            Descripción {descripcionAsc ? "🔼" : "🔽"}
          </th>

          <th className="px-6 py-3 text-left ...">Tipo de Plantilla</th>
          <th className="px-6 py-3 text-left ...">Acciones</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((plantilla) => (
          <tr key={plantilla.id}>
            <td className="px-6 py-4 ...">{plantilla.titulo}</td>
            <td className="px-6 py-4 ...">{plantilla.descripcion}</td>
            <td className="px-6 py-4 ...">{formatearTipo(plantilla.tipo)}</td>

            <td className="px-6 py-4 ...">
              {tipo === "borradores" && (
                <button
                  onClick={() => handlePublicar(plantilla.id)}
                  className="text-green-600 hover:text-green-900"
                >
                  Publicar
                </button>
              )}

              <button
                onClick={() =>
                  navigate(`/admin/instrumentos/editar/${plantilla.id}`)
                }
                className="text-indigo-600 hover:text-indigo-900 ml-4"
              >
                Editar
              </button>

              <button
                onClick={() => handleBorrar(plantilla.id)}
                className="text-red-600 hover:text-red-900 ml-4"
              >
                Borrar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
