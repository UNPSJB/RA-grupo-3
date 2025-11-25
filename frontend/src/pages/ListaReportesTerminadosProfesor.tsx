import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";

// Definimos interfaces para los datos
interface ReporteItem {
  instancia_id: number;
  materia_nombre: string;
  cuatrimestre_info?: string; // Puede venir del backend o construirse
  profesor_nombre?: string;
  fecha_fin?: string;
  estado: string; // "PENDIENTE", "COMPLETADO", "RESUMIDO", etc.
  ha_respondido?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ListaReportesProfesores: React.FC = () => {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"pendientes" | "historial">("pendientes");
  
  const [pendientes, setPendientes] = useState<ReporteItem[]>([]);
  const [historial, setHistorial] = useState<ReporteItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Cargar Pendientes (Endpoint existente)
        const resPendientes = await fetch(
          `${API_BASE_URL}/encuestas-abiertas/mis-instancias-activas-profesor`,
          { headers }
        );
        if (resPendientes.status === 401) {
            logout(); 
            return;
        }
        
        // 2. Cargar Historial (Endpoint NUEVO - Lo crearemos en el backend luego)
        // Si falla (404) porque no existe aún, no rompemos la app, solo dejamos historial vacío.
        let dataHistorial = [];
        try {
            const resHistorial = await fetch(
            `${API_BASE_URL}/encuestas-abiertas/mis-informes-historicos`,
            { headers }
            );
            if (resHistorial.ok) {
                dataHistorial = await resHistorial.json();
            }
        } catch (e) {
            console.warn("No se pudo cargar historial (quizás falta el endpoint)");
        }

        if (resPendientes.ok) {
            setPendientes(await resPendientes.json());
        }
        setHistorial(dataHistorial);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, logout]);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestión de Informes
        </h1>
        <p className="text-gray-500 mt-1">
          Administra tus informes de actividad curricular.
        </p>
      </header>

      {/* Pestañas de Navegación */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pendientes")}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "pendientes"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "historial"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Historial Completado ({historial.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* --- TABLA DE PENDIENTES --- */}
      {activeTab === "pendientes" && (
        <div className="animate-fadeIn">
          {pendientes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No tienes informes pendientes por completar.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendientes.map((item) => (
                <div key={item.instancia_id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{item.materia_nombre || "Sin Nombre"}</h3>
                    <p className="text-sm text-gray-500">
                        Estado: <span className="text-yellow-600 font-semibold bg-yellow-50 px-2 py-0.5 rounded">Pendiente</span>
                    </p>
                  </div>
                  <Link
                    to={`/profesores/reportes/instancia/${item.instancia_id}/responder`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
                  >
                    Completar Informe
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TABLA DE HISTORIAL --- */}
      {activeTab === "historial" && (
        <div className="animate-fadeIn">
          {historial.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">Aún no hay informes en el historial.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Materia</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Periodo</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historial.map((inf) => (
                    <tr key={inf.instancia_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{inf.materia_nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{inf.cuatrimestre_info || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {inf.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/profesores/reportes/instancia/${inf.instancia_id}/ver`} // Ruta de solo lectura que configuraremos
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ListaReportesProfesores;