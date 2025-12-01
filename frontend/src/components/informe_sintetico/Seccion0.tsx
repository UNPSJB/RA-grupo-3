import React, { useEffect } from "react";

interface DatosFila {
  materia_id: number;
  materia_nombre: string;
  inscriptos: number;
  teoricas: number;
  practicas: number;
}

interface Props {
  materias: { id: number; materia_nombre: string; respuestas: any[] }[]; // Vienen de datosInsumos
  valorActual: string; // El JSON stringified que guardamos en la respuesta
  onChange: (valorSerializado: string) => void;
}

export const TablaCuantitativaInput: React.FC<Props> = ({
  materias,
  valorActual,
  onChange,
}) => {
  // Parseamos el string guardado a objeto, o iniciamos vacío
  const datosGrid: Record<number, DatosFila> = valorActual
    ? JSON.parse(valorActual)
    : {};

  // Al montar, si está vacío, pre-llenamos con la estructura básica
  useEffect(() => {
    if (!valorActual) {
      const inicial: Record<number, DatosFila> = {};
      materias.forEach((m) => {
        // AQUÍ PODEMOS USAR LA LÓGICA DE AUTOCOMPLETADO NUMÉRICO
        // (Buscar en m.respuestas los valores numéricos)
        inicial[m.id] = {
          materia_id: m.id,
          materia_nombre: m.materia_nombre,
          inscriptos: 0, // O traer de DB
          teoricas: 0,
          practicas: 0,
        };
      });
      onChange(JSON.stringify(inicial));
    }
  }, []);

  const handleChange = (
    materiaId: number,
    campo: keyof DatosFila,
    valor: string
  ) => {
    const nuevosDatos = { ...datosGrid };
    if (!nuevosDatos[materiaId]) {
      // Fallback si no existe
      nuevosDatos[materiaId] = {
        materia_id: materiaId,
        materia_nombre:
          materias.find((m) => m.id === materiaId)?.materia_nombre || "",
        inscriptos: 0,
        teoricas: 0,
        practicas: 0,
      };
    }

    (nuevosDatos[materiaId] as any)[campo] = Number(valor);
    onChange(JSON.stringify(nuevosDatos));
  };

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-sky-50 text-sky-900">
          <tr>
            <th className="px-4 py-2 text-left">Asignatura</th>
            <th className="px-2 py-2 text-center w-24">Inscriptos</th>
            <th className="px-2 py-2 text-center w-24">Com. Teóricas</th>
            <th className="px-2 py-2 text-center w-24">Com. Prácticas</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {materias.map((m) => {
            const fila = datosGrid[m.id] || {
              inscriptos: 0,
              teoricas: 0,
              practicas: 0,
            };
            return (
              <tr key={m.id}>
                <td className="px-4 py-2 font-medium text-gray-700">
                  {m.materia_nombre}
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="w-full border rounded p-1 text-center"
                    value={fila.inscriptos}
                    onChange={(e) =>
                      handleChange(m.id, "inscriptos", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="w-full border rounded p-1 text-center"
                    value={fila.teoricas}
                    onChange={(e) =>
                      handleChange(m.id, "teoricas", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="w-full border rounded p-1 text-center"
                    value={fila.practicas}
                    onChange={(e) =>
                      handleChange(m.id, "practicas", e.target.value)
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2 p-2">
        * Estos datos se guardarán estructurados para generar la tabla en el
        PDF.
      </p>
    </div>
  );
};
