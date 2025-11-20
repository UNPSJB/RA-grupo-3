import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";

// 1. Definimos la interfaz basada en 'departamento/schemas.py'
interface InformeStatus {
  id: number;
  estado: string;
  materia_nombre: string;
  profesor_nombre: string;
  cuatrimestre_info: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const DepartamentoInformesPage: React.FC = () => {
  const [informes, setInformes] = useState<InformeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      setLoading(false);
      setError("No estás autenticado.");
      return;
    }

    // 2. Función para llamar al nuevo endpoint
    const fetchInformes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/departamento/mis-informes-curriculares`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("Tu sesión expiró o no tienes permisos.");
            logout();
            return;
          }
          const errData = await response.json();
          throw new Error(errData.detail || "Error al cargar los informes");
        }

        const data: InformeStatus[] = await response.json();
        if (isMounted) {
          setInformes(data);
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

    fetchInformes();

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  // 3. Renderizado de la página
  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center p-4">{error}</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Informes de Actividad Curricular Completados
      </h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Materia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Profesor Responsable
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cuatrimestre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {informes.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No se encontraron informes completados para este departamento.
                </td>
              </tr>
            ) : (
              informes.map((informe) => (
                <tr key={informe.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {informe.materia_nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {informe.profesor_nombre}
                  </td>

                  {/* --- INICIO DEL CAMBIO --- */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {(() => {
                      const parts = informe.cuatrimestre_info.split(" - ");
                      if (parts.length === 2) {
                        const [year, periodo] = parts;
                        // Capitaliza la primera letra del periodo
                        const periodoCapitalizado =
                          periodo.charAt(0).toUpperCase() + periodo.slice(1);
                        return (
                          <div>
                            <span className="font-medium text-gray-900">
                              {year}
                            </span>
                            <span className="block text-xs text-gray-600">
                              {periodoCapitalizado}
                            </span>
                          </div>
                        );
                      }
                      return informe.cuatrimestre_info; // Fallback
                    })()}
                  </td>
                  {/* --- FIN DEL CAMBIO --- */}

                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {informe.estado.charAt(0).toUpperCase() +
                        informe.estado.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartamentoInformesPage;
