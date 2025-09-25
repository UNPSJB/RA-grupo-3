import React from 'react';
import "../Styles/Styles.css";

export function Tabla() {
    // Datos de ejemplo
    const [data, setData] = React.useState([
        { year: 1, name: "Matemática" },
        { year: 3, name: "Algebra" },
        { year: 2, name: "Física" },
    ]);
    const [nameAsc, setNameAsc] = React.useState(true);
    const [yearAsc, setYearAsc] = React.useState(true);
    const [showConfirmation, setShowConfirmation] = React.useState(false);
    const hideTimeoutRef = React.useRef<number | undefined>(undefined);

    const sortByName = () => {
        const sorted = [...data].sort((a, b) => {
            if (nameAsc) {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });
        setData(sorted);
        setNameAsc(!nameAsc);
    };

    const sortByYear = () => {
        const sorted = [...data].sort((a, b) => (yearAsc ? a.year - b.year : b.year - a.year));
        setData(sorted);
        setYearAsc(!yearAsc);
    };

    const handleCompleteSurvey = () => {
        if (hideTimeoutRef.current) {
            window.clearTimeout(hideTimeoutRef.current);
        }

        setShowConfirmation(true);
        hideTimeoutRef.current = window.setTimeout(() => {
            setShowConfirmation(false);
        }, 2000);
    };

    React.useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                window.clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="tabla-wrapper">
            {showConfirmation && (
                <div className="tabla-alert" role="status" aria-live="assertive">
                    ¡Encuesta completada!
                </div>
            )}
            <table className="tabla-encuestas">
                <thead>
                    <tr>
                        <th>
                            Año
                            <button
                                className="btn btn--compact tabla-encuestas__sort-btn"
                                onClick={sortByYear}
                            >
                                {yearAsc ? "↑" : "↓"}
                            </button>
                        </th>
                        <th>
                            Nombre cursada
                            <button
                                className="btn btn--compact tabla-encuestas__sort-btn"
                                onClick={sortByName}
                            >
                                {nameAsc ? "A/Z ↑" : "Z/A ↓"}
                            </button>
                        </th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.year}</td>
                            <td>{item.name}</td>
                            <td className="tabla-encuestas__acciones">
                                <button className="btn" onClick={handleCompleteSurvey}>
                                    Completar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
