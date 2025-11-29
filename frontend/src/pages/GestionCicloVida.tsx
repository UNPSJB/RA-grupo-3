import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import Spinner from "../components/Spinner";
import { Button } from "../components/Button";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// --- Interfaces ---
interface Plantilla {
  id: number;
  titulo: string;
  estado: string;
}

interface Cursada {
  id: number;
  materia_nombre: string;
  profesor_nombre: string;
  anio: number;
  periodo: string;
}

interface InstanciaActiva {
  id: number;
  materia_nombre: string;
  fecha_inicio: string;
  estado: string;
}

interface Departamento {
  id: number;
  nombre: string;
}

const GestionCicloVida: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "activar" | "cerrar" | "sintetico"
  >("activar");

  // --- Datos ---
  const [cursadas, setCursadas] = useState<Cursada[]>([]);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [instanciasActivas, setInstanciasActivas] = useState<InstanciaActiva[]>(
    []
  );
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  const [selectedCursada, setSelectedCursada] = useState("");
  const [selectedPlantilla, setSelectedPlantilla] = useState("");

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // --- Estados del Formulario (Cerrar) ---
  const [fechaFinInforme, setFechaFinInforme] = useState("");

  // --- Estados del Formulario (Sintético) ---
  const [selectedDepto, setSelectedDepto] = useState("");
  const [fechaFinSintetico, setFechaFinSintetico] = useState("");

  // --- 1. CARGA DE DATOS ---
  const fetchDatos = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const resPlantillas = await fetch(
        `${API_BASE_URL}/admin/instrumentos/publicadas`,
        { headers }
      );
      if (resPlantillas.ok) setPlantillas(await resPlantillas.json());

      const resCursadas = await fetch(
        `${API_BASE_URL}/admin/gestion-encuestas/cursadas-disponibles`,
        { headers }
      );
      if (resCursadas.ok) setCursadas(await resCursadas.json());

      const resActivas = await fetch(
        `${API_BASE_URL}/admin/gestion-encuestas/activas`,
        { headers }
      );
      if (resActivas.ok) setInstanciasActivas(await resActivas.json());

      const resDeptos = await fetch(
        `${API_BASE_URL}/admin/gestion-encuestas/departamentos`,
        { headers }
      );
      if (resDeptos.ok) setDepartamentos(await resDeptos.json());
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [token, activeTab]);

  // --- 2. HANDLERS ---

  const handleActivar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let fechaInicioEnvio = fechaInicio;

    if (!fechaInicioEnvio) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        fechaInicioEnvio = now.toISOString().slice(0, 16); // "2025-11-29T16:45"
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/gestion-encuestas/activar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cursada_id: parseInt(selectedCursada),
            plantilla_id: parseInt(selectedPlantilla),
            fecha_inicio: fechaInicioEnvio, 
            fecha_fin: fechaFin ? fechaFin : null, 
            estado: "activa",
          }),
        }
      );
      if (!res.ok) throw new Error("Error activando encuesta");

      setMessage({
        type: "success",
        text: "Encuesta activada y planificada correctamente.",
      });
      setSelectedCursada("");
      setFechaInicio("");
      setFechaFin("");
      fetchDatos();
    } catch (err) {
      setMessage({ type: "error", text: "No se pudo activar." });
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = async (id: number) => {
    if (
      !confirm(
        "Se cerrará la encuesta de alumnos y se habilitará el informe para el profesor. ¿Continuar?"
      )
    )
      return;

    setLoading(true);
    try {
      const payload = {
        fecha_fin_informe: fechaFinInforme ? fechaFinInforme : null,
      };

      const res = await fetch(
        `${API_BASE_URL}/admin/gestion-encuestas/instancia/${id}/cerrar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Error al cerrar");

      setMessage({
        type: "success",
        text: "Encuesta cerrada. Informe docente habilitado.",
      });
      fetchDatos();
    } catch (err) {
      setMessage({ type: "error", text: "No se pudo cerrar la encuesta." });
    } finally {
      setLoading(false);
    }
  };

  const handleSintetico = async () => {
    setLoading(true);
    try {
      const payload = {
        departamento_id: parseInt(selectedDepto),
        fecha_fin_informe: fechaFinSintetico ? fechaFinSintetico : null,
      };

      const res = await fetch(
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error generando sintético");

      setMessage({
        type: "success",
        text: `Informe generado con éxito. Se agruparon ${data.cantidad_informes} reportes.`,
      });
      setFechaFinSintetico(""); // Limpiar fecha
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Gestión de Ciclo Académico
      </h1>

      {message && (
        <div
          className={`p-4 mb-6 rounded-lg shadow-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Navegación de Pestañas Mejorada */}
      <div className="flex gap-8 border-b border-gray-200 mb-8">
        {[
          { id: "activar", label: "1. Activar Encuestas" },
          { id: "cerrar", label: "2. Cerrar & Habilitar Informes" },
          { id: "sintetico", label: "3. Informes Sintéticos" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-1 font-medium text-lg transition-all duration-200 ${
              activeTab === tab.id
                ? "text-blue-700 border-b-4 border-blue-600"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- PESTAÑA 1: ACTIVAR ENCUESTAS --- */}
      {activeTab === "activar" && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Habilitar Nueva Encuesta
          </h2>
          <form onSubmit={handleActivar} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Selección */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cursada (Sin Encuesta)
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={selectedCursada}
                    onChange={(e) => setSelectedCursada(e.target.value)}
                    required
                  >
                    <option value="">Seleccione Cursada...</option>
                    {cursadas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.materia_nombre} ({c.anio} - {c.profesor_nombre})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Plantilla de Encuesta
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={selectedPlantilla}
                    onChange={(e) => setSelectedPlantilla(e.target.value)}
                    required
                  >
                    <option value="">Seleccione Plantilla...</option>
                    {plantillas
                      .filter((p) =>
                        p.titulo.toLowerCase().includes("encuesta")
                      )
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titulo}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Fechas (CAMBIO 3: Input restaurado) */}
              <div className="space-y-5 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Inicio (Planificación)
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    Si se deja vacío, se activará inmediatamente (Hoy).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Cierre{" "}
                    <span className="text-xs text-gray-400 font-normal">
                      (Opcional)
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Si se deja vacío, no tendrá límite de tiempo.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100">
              {/* CAMBIO 4: Botón grande y azul */}
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all duration-200 disabled:bg-blue-300"
              >
                {loading ? "Procesando..." : "Activar Encuesta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PESTAÑA 2: CERRAR ENCUESTAS --- */}
      {activeTab === "cerrar" && (
        <div className="space-y-8">
          {/* Configuración Global */}
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="text-indigo-900 font-bold text-lg mb-2">
              Configuración de Cierre
            </h3>
            <p className="text-sm text-indigo-700 mb-4 max-w-3xl">
              Al cerrar una encuesta, se genera automáticamente el informe para
              el profesor. Define aquí una fecha límite opcional para que los
              profesores completen su informe. Esta fecha se aplicará al
              presionar el botón "Cerrar" en la lista inferior.
            </p>

            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="w-full sm:max-w-xs">
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                  Fecha límite para Informe Docente
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-indigo-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  value={fechaFinInforme}
                  onChange={(e) => setFechaFinInforme(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Tabla de Encuestas */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-gray-800 font-semibold">Encuestas Activas</h3>
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                {instanciasActivas.length} activas
              </span>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Materia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Inicio Encuesta
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {instanciasActivas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center text-gray-500 italic"
                    >
                      No hay encuestas activas en este momento.
                    </td>
                  </tr>
                ) : (
                  instanciasActivas.map((inst) => (
                    <tr
                      key={inst.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {inst.materia_nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(inst.fecha_inicio).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* CAMBIO 5: Botón Sólido Verde (Estilo 'Cerrar y Generar') */}
                        <button
                          onClick={() => handleCerrar(inst.id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-sm transition-colors duration-200"
                          disabled={loading}
                        >
                          Cerrar y Generar Informe
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PESTAÑA 3: SINTÉTICO --- */}
      {activeTab === "sintetico" && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Generar Informe Sintético
          </h2>
          <p className="mb-6 text-gray-600 text-sm max-w-2xl">
            Selecciona un departamento para agrupar todos los informes de
            actividad curricular que estén en estado <strong>COMPLETADO</strong>
            .
          </p>

          <div className="flex flex-col gap-6">
            {/* Fila 1: Departamento */}
            <div className="w-full sm:max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departamento
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedDepto}
                onChange={(e) => setSelectedDepto(e.target.value)}
              >
                <option value="">-- Seleccione Departamento --</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Fila 2: Fecha Límite (Nuevo) */}
            <div className="w-full sm:max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha límite para completar{" "}
                <span className="font-normal text-gray-500">(Opcional)</span>
              </label>
              <input
                type="datetime-local"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={fechaFinSintetico}
                onChange={(e) => setFechaFinSintetico(e.target.value)}
              />
            </div>

            {/* Botón */}
            <div className="pt-2">
              <button
                onClick={handleSintetico}
                disabled={!selectedDepto || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "Generando..." : "Generar Informe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCicloVida;
