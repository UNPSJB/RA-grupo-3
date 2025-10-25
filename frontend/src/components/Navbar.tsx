import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import "../Styles/Styles.css";
import { ProfileIcon, ChartLineIcon, ClipboardListIcon } from "./icons";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="flex items-center gap-2">
        {" "}
        {/* Contenedor para los botones */}
        <Button
          variant="ghost"
          className="navbar__button"
          onClick={() => navigate("/admin")}
        >
          Administrador
        </Button>
        <Button
          variant="ghost"
          className="navbar__button"
          onClick={() => navigate("/encuestas")}
        >
          <ClipboardListIcon></ClipboardListIcon>
          Encuestas
        </Button>
        <Button
          variant="ghost"
          className="navbar__button"
          onClick={() => navigate("/estadisticas")}
        >
          <ChartLineIcon></ChartLineIcon>
          Estadisticas
        </Button>
        <Button
          variant="ghost"
          className="navbar__button"
          onClick={() => navigate("/cuenta")}
        >
          <ProfileIcon></ProfileIcon>
          Cuenta
        </Button>
      </div>
    </nav>
  );
};
