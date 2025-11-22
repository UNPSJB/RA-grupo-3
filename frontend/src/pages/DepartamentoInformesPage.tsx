
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 1. Importamos useNavigate
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
  const navigate = useNavigate(); // 2. Inicializamos el hook de navegación
  const [informes, setInformes] = useState<InformeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); // 3. Estado para el botón
  const [error, setError] = useState<string | null>(null);
  const { token, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      setLoading(false);
      setError("No estás autenticado.");
      return;
    }

    // 2. Función para llamar al nuevo endpoint (Listado)
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

  // --- LÓGICA DE GENERACIÓN DE INFORME SINTÉTICO ---
  const handleGenerarSintetico = async () => {
    if (!token) return;
    setIsGenerating(true);
    setError(null);

    try {
      // Payload requerido por el endpoint robusto
      const payload = {
        departamento_id: 1, // Usamos ID 1 como acordamos (o dinámico si lo tuvieras en el user)
        fecha_fin_informe: new Date().toISOString(), // Fecha actual como cierre por defecto
      };

      const response = await fetch(
        `${API_BASE_URL}/admin/gestion-encuestas/generar-sintetico`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Error al generar el informe sintético.");
      }

      const data = await response.json();
      
      // Navegamos al detalle usando el ID retornado (instancia_id)
      navigate(`/departamento/informe-sintetico/${data.instancia_id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el informe.");
      setIsGenerating(false); // Solo desactivamos si falla, si tiene éxito navegamos fuera
    }
  };

  // 3. Renderizado de la página
  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      
      {/* CABECERA CON BOTÓN DE ACCIÓN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Informes de Actividad Curricular Completados
        </h1>
        
        {/* Botón Generar Informe Sintético */}
        <button
          onClick={handleGenerarSintetico}
          disabled={isGenerating || informes.length === 0}
          className={`
            px-5 py-2.5 rounded-lg font-semibold text-white shadow-md transition-all flex items-center gap-2
            ${
              isGenerating || informes.length === 0
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }
          `}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generando...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Generar Informe Sintético
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
          <p className="font-bold">Error</p> <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
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
                  className="px-6 py-8 text-center text-gray-500 italic"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p>No se encontraron informes completados para procesar.</p>
                  </div>
                </td>
              </tr>
            ) : (
              informes.map((informe) => (
                <tr key={informe.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {informe.materia_nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {informe.profesor_nombre}
                  </td>

                  {/* --- LOGICA DE CUATRIMESTRE --- */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {(() => {
                      const parts = informe.cuatrimestre_info.split(" - ");
                      if (parts.length === 2) {
                        const [year, periodo] = parts;
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
                  {/* --- FIN LOGICA DE CUATRIMESTRE --- */}

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