
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Encuesta = {
  id: number;
  titulo: string;
  // otros campos opcionales
};

export default function VerEncuesta() {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/encuestas/publicadas`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: Encuesta[] = await res.json();
        setEncuestas(data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las encuestas.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Cargando encuestas...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!encuestas.length) return <div>No hay encuestas.</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Seleccionar encuesta</h2>
      <ul className="space-y-2">
        {encuestas.map((e) => (
          <li key={e.id}>
            <button
              className="w-full text-left p-3 border rounded hover:bg-gray-50 transition"
              onClick={() => navigate(`/encuestas/${e.id}/completa`)}
            >
              {e.titulo}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

