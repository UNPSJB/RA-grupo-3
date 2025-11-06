import React from "react";
import { useNavigate } from "react-router-dom";



type Shortcut = {
  label: string;
  path: string;
};

const shortcuts: Shortcut[] = [
  { label: "Inicio", path: "/" },
  { label: "Listado de Plantillas", path: "/departamento/plantillas/borradores" },
  { label: "Crear Plantilla", path: "/departamento/plantillas/crear" },
  { label: "Estadísticas", path: "/departamento/estadisticas" },
  { label: "Cuenta", path: "/cuenta" },
  { label: "Resultados de Encuestas", path: "/resultados-profesor" },
];
const PanelAdmin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <h1 className="admin-panel__title">Panel de administración</h1>
      </header>

      <div className="admin-shortcuts">
        {shortcuts.map(({ label, path }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="admin-shortcut"
          >
            <span className="admin-shortcut__label">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default PanelAdmin;
