import React from "react";
import Spinner from "./Spinner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// ... (Tipos y interfaces no cambian) ...
type TipoInstrumento = "ENCUESTA" | "ACTIVIDAD_CURRICULAR" | "INFORME_SINTETICO";
interface Plantilla { id: number; titulo: string; descripcion: string; tipo: TipoInstrumento; estado: string; }
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
type TipoTabla = "borradores" | "publicadas";
interface TablaProps { tipo: TipoTabla; }
function formatearTipo(tipo: TipoInstrumento) { /* ... */ }

export function Tabla({ tipo }: TablaProps) {
  const navigate = useNavigate();
  const [data, setData] = React.useState<Plantilla[]>([]);
  // ... (otros states)
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tituloAsc, setTituloAsc] = React.useState(true);
  const [descripcionAsc, setDescripcionAsc] = React.useState(true);

  const { token, logout } = useAuth();

  // ... (funciones de sort no cambian)
  const sortByTitulo = () => { /* ... */ };
  const sortByDescripcion = () => { /* ... */ };

  React.useEffect(() => {
    let isMounted = true;

    if (!token){
      setLoading(false);
      setError("Necesitas iniciar sesion como administrador.");
      return;
    }

    const loadPlantillas = async () => {
      setLoading(true);
      setError(null);
      setData([]);
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/instrumentos/${tipo.toLowerCase()}`,
          {
            headers: {
              "Authorization": `Bearer ${token}` // <-- Corregido
            }
          }
        );
        if (!response.ok) {
          // ... (manejo de errores)
          if (response.status === 401 || response.status === 403) {
            setError("Tu sesión expiró o no tienes permisos de administrador.");
            logout();
            return;
          }
          // ...
          throw new Error("Error fetching");
        }
        const payload: Plantilla[] = await response.json();
        if (isMounted) setData(payload);
      } catch (err) {
        // ... (manejo de errores)
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPlantillas();
    return () => {
      isMounted = false;
    };
  }, [tipo, token, logout]);

  const handlePublicar = async (plantillaId: number) => {
    setError(null);

    if (!token){
      setError("Tu sesion ha expirado.");
      logout();
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/instrumentos/${plantillaId}/publicar`,
        { 
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}` // <-- Corregido
          }
        }
      );
      if (!response.ok) {
        // ... (manejo de errores)
        if (response.status === 401 || response.status === 403) {
            setError("Tu sesión expiró o no tienes permisos.");
            logout();
         }
        throw new Error("Falló la publicación");
      }
      setData((prevData) =>
        prevData.filter((plantilla) => plantilla.id !== plantillaId)
      );
    } catch (err) {
      // ... (manejo de errores)
    }
  };

  const handleBorrar = async (plantillaId: number) => {
    if (!window.confirm("¿Estás seguro?")) {
      return;
    }

    if (!token) {
        setError("Tu sesión ha expirado.");
        logout();
        return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/instrumentos/${plantillaId}`,
        {
          method: "DELETE",
          headers: { 
            "Authorization": `Bearer ${token}` // <-- Corregido
          }
        }
      );
      if (!response.ok) {
        // ... (manejo de errores)
         if (response.status === 401 || response.status === 403) {
            setError("Tu sesión expiró o no tienes permisos.");
            logout();
         }
        throw new Error("Falló la eliminación");
      }
      setData((prevData) =>
        prevData.filter((plantilla) => plantilla.id !== plantillaId)
      );
    } catch (err) {
      // ... (manejo de errores)
    }
  };

  // ... (Tu JSX no cambia) ...
  if (loading) {
    return <Spinner />;
  }
  // ...
  return (
    <table className="min-w-full divide-y divide-gray-200">
      {/* ... (JSX de la tabla) ... */}
    </table>
  );
}