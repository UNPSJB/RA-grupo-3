import { Tabla } from "../components/Tabla.tsx";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ButtonGroup } from "../components/ButtonGroup";
import { CheckIcon, TrashIcon } from "../components/icons";

const EncuestasPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tipo = location.pathname.endsWith("/publicadas")
    ? "publicadas"
    : "borradores";
  console.log(
    `EncuestasPage - Pathname: ${location.pathname}, Tipo derivado: ${tipo}`
  );

  const viewButtons = [
    {
      id: "drafts",
      label: "Borradores",
      icon: <TrashIcon />,

      onClick: () => navigate("/admin/plantillas/borradores"),
      isActive: tipo === "borradores",
    },
    {
      id: "published",
      label: "Publicadas",
      icon: <CheckIcon />,
      onClick: () => navigate("/admin/plantillas/publicadas"),
      isActive: tipo === "publicadas",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-gray-900 pb-3 border-b border-gray-200">
          {tipo === "borradores"
            ? "Plantillas en Borrador"
            : "Plantillas Publicadas"}{" "}
        </h2>

        <div>
          <ButtonGroup buttons={viewButtons}></ButtonGroup>
        </div>
      </div>
      <Tabla tipo={tipo} />
    </div>
  );
};
export default EncuestasPage;
