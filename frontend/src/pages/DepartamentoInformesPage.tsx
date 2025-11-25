import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";

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
    if (!token) return;

    const fetchInformes = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/departamento/mis-informes-curriculares`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          if (response.status === 401) logout();
          throw new Error("Error al cargar los informes");
        }

        const data = await response.json();
        if (isMounted) setInformes(data);
      } catch (err) {
        if (isMounted) setError("Error de conexión");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInformes();
    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  if (loading) return <Spinner />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Informes de Cátedra Recibidos
        </h1>
        <p className="text-gray-500 mt-2">
          Monitoreo de entregas de los profesores.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Materia
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Profesor
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Ciclo
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {informes.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500 italic"
                >
                  No hay informes completados aún.
                </td>
              </tr>
            ) : (
              informes.map((informe) => (
                <tr
                  key={informe.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {informe.materia_nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {informe.profesor_nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {informe.cuatrimestre_info}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${
                        informe.estado === "resumido"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {informe.estado.toUpperCase()}
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
