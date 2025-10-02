import React from "react";
import { useNavigate } from "react-router-dom";
type Shortcut = {
  label: string;
  path: string;
};
const shortcuts: Shortcut[] = [
  { label: "Inicio", path: "/"},
  { label: "Listado de encuestas", path: "/encuestas"},
  { label: "Crear encuesta", path: "/encuestas/crear"},
  { label: "Completar encuesta", path: "/encuestas/completar"},
  { label: "Estadísticas", path: "/estadisticas"},
  { label: "Cuenta", path: "/cuenta"},
];
const PanelAdmin: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="p-6 max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Panel de administración</h1>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="w-full rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="block text-lg font-semibold text-gray-900">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
export default PanelAdmin;
