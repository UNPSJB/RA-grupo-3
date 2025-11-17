import React from "react";
import Spinner from "./Spinner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// --- Definimos los tipos aquí mismo ---
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

// --- Función para formatear el texto del tipo ---
function formatearTipo(tipo: TipoInstrumento) {
  switch (tipo) {
    case "ENCUESTA":
      return "Encuesta Alumno";
    case "ACTIVIDAD_CURRICULAR":
      return "Actividad Curricular";
    case "INFORME_SINTETICO":
      return "Informe Sintético";
    default:
      return tipo;
  }
}

export function Tabla({ tipo }: TablaProps) {
  const navigate = useNavigate();
  const [data, setData] = React.useState<Plantilla[]>([]);
  const [loading, setLoading] = React.useState(true); // Inicia en true
  const [error, setError] = React.useState<string | null>(null);

  // States de ordenamiento (opcional, pero bueno tenerlos)
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof Plantilla;
    asc: boolean;
  } | null>(null);

  const { token, logout } = useAuth();

  // --- Lógica de Sorteo (Opcional) ---
  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.asc ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.asc ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key: keyof Plantilla) => {
    let asc = true;
    if (sortConfig && sortConfig.key === key && sortConfig.asc) {
      asc = false;
    }
    setSortConfig({ key, asc });
  };
  // --- Fin Lógica de Sorteo ---

  React.useEffect(() => {
    let isMounted = true;

    if (!token) {
      setLoading(false);
      setError("Necesitas iniciar sesion como administrador.");
      return;
    }

    const loadPlantillas = async () => {
      setLoading(true);
      setError(null);
      // No seteamos data a [], esperamos la nueva data
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/instrumentos/${tipo.toLowerCase()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("Tu sesión expiró o no tienes permisos de administrador.");
            logout();
            return;
          }
          const errData = await response.json();
          throw new Error(errData.detail || "Error cargando las plantillas");
        }

        const payload: Plantilla[] = await response.json();

        if (isMounted) {
          setData(payload); // <-- Aquí se cargan los datos
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPlantillas();

    return () => {
      isMounted = false;
    };
  }, [tipo, token, logout]); // Se ejecuta cada vez que 'tipo' (borrador/publicada) cambia

  // ... (Funciones handlePublicar y handleBorrar) ...
  const handlePublicar = async (plantillaId: number) => {
    // ... (lógica para publicar)
  };
  const handleBorrar = async (plantillaId: number) => {};

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort("titulo")}
            >
              Título
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort("descripcion")}
            >
              Descripción
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort("tipo")}
            >
              Tipo
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                No se encontraron plantillas.
              </td>
            </tr>
          ) : (
            sortedData.map((plantilla) => (
              <tr key={plantilla.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {plantilla.titulo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {plantilla.descripcion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatearTipo(plantilla.tipo)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {tipo === "borradores" && (
                    <button
                      onClick={() => handlePublicar(plantilla.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Publicar
                    </button>
                  )}
                  <button
                    onClick={() => handleBorrar(plantilla.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
