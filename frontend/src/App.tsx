import React from "react";
import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar.tsx";
import EncuestasPage from "./pages/EncuestasPage.tsx";
import EstadisticasPage from "./pages/EstadisticasPage.tsx";
import CuentaPage from "./pages/CuentaPage.tsx";
import logo from "./img/Logo50Color_conletras.png";
import CrearPregunta from "./pages/CrearPregunta.tsx";
import ResponderEncuesta from "./pages/ResponderEncuesta.tsx";
import CrearEncuesta from "./pages/CrearEncuesta.tsx";
import Home from "./pages/Home.tsx";
import PanelAdmin from "./pages/panelAdmin.tsx";
import "./Styles/Styles.css";
import VerEncuesta from "./pages/VerEncuesta.tsx";

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
        <Route path="encuestas" element={<Outlet />}>
          {/* redirección por defecto */}
          <Route index element={<Navigate to="borradores" replace />} />

          {/* vistas de encuestas según su estado */}
          <Route
            path="borradores"
            element={<EncuestasPage tipo="borradores" />}
          />
          <Route
            path="publicadas"
            element={<EncuestasPage tipo="publicadas" />}
          />
          <Route path="crearEncuesta" element={<CrearEncuesta />} />
        </Route>
        <Route path="estadisticas" element={<EstadisticasPage />} />
        <Route path="cuenta" element={<CuentaPage />} />
        <Route path="admin" element={<PanelAdmin />} />
        <Route path="encuestas/completar" element={<VerEncuesta />} />
        <Route path="encuestas/:id/completa" element={<ResponderEncuesta />} />
      </Route>
    </Routes>
  );
};

export default App;
