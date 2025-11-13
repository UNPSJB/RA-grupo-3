import React from "react";
import { useNavigate } from "react-router-dom";

type Shortcut = {
  label: string;
  path: string;
  active: boolean;
};

// --- CAMBIO: Actualizar las rutas a /departamento ---
const shortcuts: Shortcut[] = [
  { label: "Listado de Plantillas", path: "/departamento/plantillas/borradores", active: true },
  { label: "Crear Plantilla", path: "/departamento/plantillas/crear", active: true },
  { label: "Estadísticas", path: "/departamento/estadisticas", active: false },
  { label: "Cuenta", path: "/cuenta", active: true },
  { label: "Resultados de Encuestas", path: "/resultados-profesor", active: false },
  { label: "Gestion de Cuentas", path: "/departamento/gestion", active: true },
];
// --- FIN DEL CAMBIO ---

const PanelAdmin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-gray-100 min-h-screen p-8 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {shortcuts.map(({ label, path, active }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            disabled={!active}
            className={`
              flex flex-col items-center justify-center
              group
              h-32 w-full
              gap-4
              rounded-2xl
              border border-blue-100
              bg-white
              p-6
              shadow-lg
              transition-all duration-300
              ease-in-out
              ${active ? 'hover:-translate-y-1 hover:bg-gray-100 hover:shadow-2xl cursor-pointer' : 'opacity-50 cursor-not-allowed'}
              focus:outline-none
              focus:ring-2
              focus:ring-gray-400
              focus:ring-opacity-50
            `}
          >
            <span className="text-lg font-semibold text-gray-800 text-center">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default PanelAdmin;