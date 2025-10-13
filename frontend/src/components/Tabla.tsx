import React from 'react';
import "../Styles/Styles.css";
import { useNavigate } from 'react-router-dom';

export function Tabla() {
    // Datos de ejemplo

    const navigate = useNavigate();


    const [tituloAsc, setTituloAsc] = React.useState(true);
    const [descripcionAsc, setDescripcionAsc] = React.useState(true);
    // const [showConfirmation, setShowConfirmation] = React.useState(false);
    // const hideTimeoutRef = React.useRef<number | undefined>(undefined);

    type Encuesta = {id: number; titulo: string; descripcion: string};

    const [data, setData] = React.useState<Encuesta[]>([]);


    const sortByTitulo = () => {
        const sorted = [...data].sort((a, b) =>
            tituloAsc ? a.titulo.localeCompare(b.titulo) : b.titulo.localeCompare(a.titulo)
        );
        setData(sorted);
        setTituloAsc(!tituloAsc);
    };


    const sortByDescripcion = () => {
        const sorted = [...data].sort((a,b) =>
            descripcionAsc ? a.descripcion.localeCompare(b.descripcion) : b.descripcion.localeCompare(a.descripcion)
        );
        setData(sorted);
        setDescripcionAsc(!descripcionAsc)
    };

    // const handleCompleteSurvey = () => {
    //     if (hideTimeoutRef.current) {
    //         window.clearTimeout(hideTimeoutRef.current);
    //     }

    //     setShowConfirmation(true);
    //     hideTimeoutRef.current = window.setTimeout(() => {
    //         setShowConfirmation(false);
    //     }, 2000);
    // };

    React.useEffect(() => {
        fetch('http://localhost:8000/encuestas')
        .then(res => res.json())
        .then(setData)
        .catch((err) => console.error('No se puede cargar encuestas', err));
    }, []);

    return (
        <div className="tabla-wrapper">
            {/* {showConfirmation && (
                <div className="tabla-alert" role="status" aria-live="assertive">
                    ¡Encuesta completada!
                </div>
            )} */}
            <table className="tabla-encuestas">
                <thead>
                    <tr>
                        <th>
                            Titulo
                            <button
                                className="btn btn--compact tabla-encuestas__sort-btn"
                                onClick={sortByTitulo}
                            >
                                {tituloAsc ? "A/Z ↑" : "Z/A ↓"}
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
                    {data.map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.titulo}</td>
                            <td>{item.descripcion}</td>
                            <td className="tabla-encuestas__acciones">
                                <button className="completar__button" onClick={() => navigate('/encuestas/completar')}>
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
