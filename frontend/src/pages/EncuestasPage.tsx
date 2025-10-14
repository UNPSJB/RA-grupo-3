import { Tabla } from "../components/Tabla.tsx";
import React from "react";
import { useNavigate } from "react-router-dom";
import { ButtonGroup } from "../components/ButtonGroup";
import { CheckIcon, TrashIcon } from "../components/icons";

export type TipoEncuesta = "borradores" | "publicadas";

export interface EncuestaPageProps {
  tipo: TipoEncuesta;
}

const EncuestasPage: React.FC<EncuestaPageProps> = ({ tipo }) => {
  const navigate = useNavigate();
  const viewButtons = [
    {
      id: "drafts",
      label: "Borradores",
      icon: <TrashIcon />,

      onClick: () => navigate("/encuestas/borradores"),

      isActive: tipo === "borradores",
    },
    {
      id: "published",
      label: "Publicadas",
      icon: <CheckIcon />,

      onClick: () => navigate("/encuestas/publicadas"),

      isActive: tipo === "publicadas",
    },
  ];
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-gray-900 pb-3 border-b border-gray-200">
          {tipo === "borradores"
            ? "Encuestas en Borrador"
            : "Encuestas Publicadas"}
        </h2>

        {/* El ButtonGroup, que ahora controla la navegación */}
        <div>
          <ButtonGroup buttons={viewButtons}></ButtonGroup>
        </div>
      </div>
      <Tabla tipo={tipo} />
    </div>
  );
};
export default EncuestasPage;
