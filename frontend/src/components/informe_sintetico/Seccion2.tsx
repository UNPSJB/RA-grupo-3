import React from "react";

interface InformeCurricular {
  id: number;
  materia_nombre: string;
}

interface Seccion2Props {
  materiasFiltradas: InformeCurricular[];
  respuestas: { [key: string]: string };
  handleInputChange: (key: string, valor: string) => void;
  preguntaId: number;
}

const Seccion2: React.FC<Seccion2Props> = ({ materiasFiltradas, respuestas, handleInputChange, preguntaId }) => {
  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200 mb-4">
      <div className="overflow-x-auto">
        <div className="flex font-bold bg-gray-100 p-2 rounded">
          <div className="w-1/5">Código actividad curricular</div>
          <div className="w-2/5">Actividad curricular</div>
          <div className="w-1/5">Horas de clases dictadas sobre el total establecido</div>
          <div className="w-1/5">Justificación</div>
        </div>

        {materiasFiltradas.map((m) => (
          <div key={m.id} className="flex border-b border-gray-200 p-2 items-start">
            <div className="w-1/5">{m.id}</div>
            <div className="w-2/5">{m.materia_nombre}</div>
            <div className="w-1/5">
              <input
                type="text"
                className="w-full h-10 border rounded p-1"
                value={respuestas[`p${preguntaId}_m${m.id}_h`] || ""}
                onChange={(e) => handleInputChange(`p${preguntaId}_m${m.id}_h`, e.target.value)}
                required
              />
            </div>
            <div className="w-1/5">
              <textarea
                className="w-full h-10 border rounded p-1 resize-none"
                rows={1}
                value={respuestas[`p${preguntaId}_m${m.id}_j`] || ""}
                onChange={(e) => handleInputChange(`p${preguntaId}_m${m.id}_j`, e.target.value)}
                required
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Seccion2;
