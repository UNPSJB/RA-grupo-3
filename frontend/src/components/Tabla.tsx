import React from 'react';
import "../Styles/Styles.css";
import { useNavigate } from 'react-router-dom';

type Opcion = { id: number; texto: string };
type Pregunta = {
    id: number;
    texto: string;
    tipo: string;
    opciones?: Opcion[] | null;
};
type Encuesta = {
    id: number;
    titulo: string;
    descripcion: string;
    anio_carrera?: number;
    cursada?: string;
    esta_completa?: boolean;
    preguntas: Pregunta[];
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function Tabla() {
    const navigate = useNavigate();

    const [tituloAsc, setTituloAsc] = React.useState(true);
    const [descripcionAsc, setDescripcionAsc] = React.useState(true);
    const [anioAsc, setAnioAsc] = React.useState(true);
    const [data, setData] = React.useState<Encuesta[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedYear, setSelectedYear] = React.useState<string>('');

    const sortByTitulo = () => {
        const sorted = [...data].sort((a, b) =>
            tituloAsc ? a.titulo.localeCompare(b.titulo) : b.titulo.localeCompare(a.titulo)
        );
        setData(sorted);
        setTituloAsc(!tituloAsc);
    };

    const sortByDescripcion = () => {
        const sorted = [...data].sort((a, b) =>
            descripcionAsc ? a.descripcion.localeCompare(b.descripcion) : b.descripcion.localeCompare(a.descripcion)
        );
        setData(sorted);
        setDescripcionAsc(!descripcionAsc);
    };

    const sortByAnio = () => {
        const sorted = [...data].sort((a, b) => {
            const valueA = typeof a.anio_carrera === "number" ? a.anio_carrera : null;
            const valueB = typeof b.anio_carrera === "number" ? b.anio_carrera : null;

            if (valueA === valueB) {
                return 0;
            }

            if (valueA === null) {
                return anioAsc ? 1 : -1;
            }

            if (valueB === null) {
                return anioAsc ? -1 : 1;
            }

            return anioAsc ? valueA - valueB : valueB - valueA;
        });

        setData(sorted);
        setAnioAsc(!anioAsc);
    };
    React.useEffect(() => {
        let isMounted = true;

        const loadEncuestas = async () => {
            setLoading(true);
            setError(null);

            try {
                const query = selectedYear ? `?anio=${selectedYear}` : "";
                const response = await fetch(`${API_BASE_URL}/encuestas${query}`);
                if (!response.ok) {
                    throw new Error(`Error ${response.status}`);
                }

                const payload: Encuesta[] = await response.json();
                if (isMounted) {
                    setData(payload);
                }
            } catch (err) {
                console.error("No se puede cargar encuestas", err);
                if (isMounted) {
                    setError("No se pudieron cargar las encuestas");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadEncuestas();

        return () => {
            isMounted = false;
        };
    }, [API_BASE_URL, selectedYear]);

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYear(event.target.value);
    };

    return (
        <div className="tabla-wrapper">
            {/* {showConfirmation && (
                <div className="tabla-alert" role="status" aria-live="assertive">
                    ¡Encuesta completada!
                </div>
            )} */}
            <div className="tabla-encuestas__filters">
                <label htmlFor="tabla-encuestas-anio" className="tabla-encuestas__label">
                    Año: 
                </label>
                <select
                    id="tabla-encuestas-anio"
                    className="tabla-encuestas__select"
                    value={selectedYear}
                    onChange={handleYearChange}
                >
                    <option value="">Todos</option>
                    <option value="1">1°</option>
                    <option value="2">2°</option>
                    <option value="3">3°</option>
                    <option value="4">4°</option>
                    <option value="5">5°</option>
                </select>
            </div>
            <table className="tabla-encuestas">
                <thead> 
                    <tr>
                        <th>
                            Año
                            <button
                                className="btn btn--compact tabla-encuestas__sort-btn"
                                onClick={sortByAnio}
                            >
                                {anioAsc ? "↑" : "↓"}
                            </button>
                        </th>
                        <th>
                            Titulo
                            <button
                                className="btn btn--compact tabla-encuestas__sort-btn"
                                onClick={sortByTitulo}
                            >
                                {tituloAsc ? "Z/A ↑" : "A/Z ↓"}
                            </button>
                        </th>
                        <th>
                            Descripcion
                            <button
                                className="btn btn--compact tabla-encuestas__sort-btn"
                                onClick={sortByDescripcion}
                            >
                                {descripcionAsc ? "A/Z ↑" : "Z/A ↓"}
                            </button>
                        </th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                        <tr>
                            <td colSpan={4}>Cargando encuestas...</td>
                        </tr>
                    )}
                    {error && !loading && (
                        <tr>
                            <td colSpan={4}>{error}</td>
                        </tr>
                    )}
                    {!loading && !error && data.length === 0 && (
                        <tr>
                            <td colSpan={4}>No hay encuestas disponibles.</td>
                        </tr>
                    )}
                    {!loading && !error && data.map((item) => {
                        const encuestaCompleta = Boolean(item.esta_completa);

                        return (
                            <tr key={item.id}>
                                <td>{typeof item.anio_carrera === "number" ? `${item.anio_carrera}°` : "-"}</td>
                                <td>{item.titulo}</td>
                                <td>{item.descripcion}</td>
                                <td className="tabla-encuestas__acciones">
                                    <button
                                        className="tabla-encuestas__btn tabla-encuestas__btn--completar"
                                        onClick={() => navigate(`/encuestas/${item.id}/completar`)}
                                        disabled={encuestaCompleta}
                                    >
                                        Completar
                                    </button>
                                    <button
                                        className="tabla-encuestas__btn tabla-encuestas__btn--modificar"
                                        onClick={() => navigate(`/encuestas/${item.id}/modificar`)}
                                        disabled={!encuestaCompleta}
                                    >
                                        Modificar
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
