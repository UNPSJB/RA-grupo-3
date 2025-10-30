import React from "react";
import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar.tsx";
import EncuestasPage from "./pages/EncuestasPage.tsx";
import EstadisticasPage from "./pages/EstadisticasPage.tsx";
import CuentaPage from "./pages/CuentaPage.tsx";
import logo from "./img/Logo50Color_conletras.png";
import ResponderEncuesta from "./pages/ResponderEncuesta.tsx";
import CrearEncuesta from "./pages/CrearEncuesta.tsx";
import Home from "./pages/Home.tsx";
import PanelAdmin from "./pages/panelAdmin.tsx";
import ListaEncuestasAlumnos from "./pages/ListaEncuestasAlumnos.tsx";
import ResultadosProfesorPage from "./pages/ResultadosProfesorPage.tsx";

import "./Styles/Styles.css";

const MainLayout: React.FC = () => (
  <div className="app">
    <header className="app-header">
      <div className="app-header__branding">
        <img className="app-header__logo" src={logo} alt="Logo Universidad" />
        <h1 className="app-header__title">Encuestas UNPSJB</h1>
      </div>
      <Navbar />
    </header>
    <main className="app-main">
      <Outlet />
    </main>
  </div>
);

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        {/* --- Rutas de Administración --- */}
        <Route path="admin" element={<Outlet />}>
          {" "}
          {/* Agrupa rutas admin */}
          <Route index element={<PanelAdmin />} />
          <Route path="plantillas" element={<Outlet />}>
            {" "}
            {/* Rutas para gestionar plantillas */}
            <Route index element={<Navigate to="borradores" replace />} />{" "}
            <Route path="borradores" element={<EncuestasPage />} />
            <Route path="publicadas" element={<EncuestasPage />} />
            <Route path="crear" element={<CrearEncuesta />} />{" "}
          </Route>
        </Route>
        {/* --- Rutas de Alumno --- */}
        <Route
          path="encuestas-activas"
          element={<ListaEncuestasAlumnos />}
        />{" "}
        <Route
          path="encuestas/instancia/:instanciaId/responder"
          element={<ResponderEncuesta />}
        />
        {/* --- Rutas de Profesor --- */}
        <Route
          path="resultados-profesor"
          element={<ResultadosProfesorPage />}
        />
        <Route path="estadisticas" element={<EstadisticasPage />} />
        <Route path="cuenta" element={<CuentaPage />} />
      </Route>
    </Routes>
  );
};
export default App;
