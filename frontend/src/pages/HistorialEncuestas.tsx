import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import ProgresoDonutChart from "../components/estadisticas/ProgresoDonutChart";
import Spinner from "../components/Spinner";
import { ClipboardListIcon } from "../components/icons";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface DetallePendiente {
  materia: string;
  anio: number;
  cuatrimestre: string;
}

interface HistorialStats {
  total: number;
  completadas: number;
  pendientes: number;
  detalle_pendientes: DetallePendiente[];
}

const HistorialEncuestas: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<HistorialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarDetalle, setMostrarDetalle] = useState(false); // Para mas detalles

  useEffect(() => {
    fetch(`${API_BASE_URL}/encuestas-abiertas/historial-estadisticas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;
  if (!stats) return <div>No hay datos disponibles.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">
        Mi Historial Académico
      </h1>

      {/* Sección Superior: Gráfico y Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gráfico */}
        <ProgresoDonutChart
          completadas={stats.completadas}
          pendientes={stats.pendientes}
        />

        {/* Tarjeta de Acción / Resumen Texto */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <ClipboardListIcon className="w-8 h-8" />
            <h3 className="text-xl font-semibold">Resumen General</h3>
          </div>
          <p className="text-gray-600">
            Has cursado un total de{" "}
            <span className="font-bold">{stats.total}</span> materias que
            requerían encuestas.
          </p>
          <p className="text-gray-600">
            ¡Gracias por tu compromiso! Tus respuestas ayudan a mejorar la
            calidad educativa.
          </p>

          <hr className="border-gray-100 my-4" />

          {/* Botón para ver el detalle (simula ir a otro apartado) */}
          <button
            onClick={() => setMostrarDetalle(!mostrarDetalle)}
            className="w-full py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 flex justify-center items-center gap-2"
          >
            {mostrarDetalle
              ? "Ocultar Detalle"
              : "Ver Detalle de No Completadas"}
            <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-indigo-200">
              {stats.pendientes}
            </span>
          </button>
        </div>
      </div>

      {/* Apartado de Detalle (Condicional) */}
      {mostrarDetalle && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden animate-fadeIn">
          <div className="bg-red-50 px-6 py-4 border-b border-red-100">
            <h3 className="text-lg font-bold text-red-800">
              Encuestas No Respondidas
            </h3>
            <p className="text-sm text-red-600">
              Estas encuestas ya cerraron y no fueron completadas.
            </p>
          </div>

          {stats.detalle_pendientes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ¡Excelente! No tienes encuestas pendientes en tu historial.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Materia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Periodo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.detalle_pendientes.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {item.materia}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.anio}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {item.cuatrimestre}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default HistorialEncuestas;
