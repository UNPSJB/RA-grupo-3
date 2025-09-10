

export const Navbar = () => {
  return (
    <div>
        <nav className="navbar bg-dark border-bottom border-body" data-bs-theme="dark">
            <ul className="nav nav-tabs">
            <li>
                <a className="nav-link" aria-current="page" href="#">Home</a>
            </li>
            <li className="nav-item">
                <a className="nav-link active" aria-current="page" href="#">Encuestas</a>
            </li>
            <li className="nav-item">
                <a className="nav-link" href="#">Respondidas</a>
            </li>
            <li className="nav-item">
                <a className="nav-link" href="#">Estadisticas</a>
            </li>
            <li className="nav-item">
                <a className="nav-link disabled" aria-disabled="true">Usuario</a>
            </li>
            </ul>
        </nav>
    </div>
  );
}


