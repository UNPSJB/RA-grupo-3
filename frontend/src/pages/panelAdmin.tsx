import React from "react";
import { useNavigate } from "react-router-dom";



type Shortcut = {
  label: string;
  path: string;
};

const shortcuts: Shortcut[] = [
  { label: "Inicio", path: "/" },
  { label: "Listado de Plantillas", path: "/secretaria/plantillas/borradores" },
  { label: "Crear Plantilla", path: "/secretaria/plantillas/crear" },
  { label: "Estadísticas", path: "/secretaria/estadisticas" },
  { label: "Cuenta", path: "/cuenta" },
  { label: "Resultados de Encuestas", path: "/resultados-profesor" },
  { label: "Gestion de Cuentas", path: "/secretaria/gestion" },
];
const PanelAdmin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-gray-100 min-h-screen p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {shortcuts.map(({ label, path }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="
              flex flex-col items-center justify-center
              group
              min-h-[8rem]
              w-full
              gap-4
              rounded-2xl
              border border-blue-100
              bg-white
              p-6
              shadow-lg
              transition-all duration-300
              ease-in-out
              hover:-translate-y-1
              hover:bg-gray-100
              hover:shadow-2xl
              focus:outline-none
              focus:ring-2
              focus:ring-gray-400
              focus:ring-opacity-50
              cursor-pointer
            "
          >
            <span className="text-lg font-semibold text-gray-800 text-center">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default PanelAdmin;
