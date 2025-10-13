import React from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar.tsx';
import EncuestasPage from './pages/EncuestasPage.tsx';
import EstadisticasPage from './pages/EstadisticasPage.tsx';
import CuentaPage from './pages/CuentaPage.tsx';
import logo from './img/Logo50Color_conletras.png';

import CrearEncuesta from './pages/CrearEncuesta.tsx';
import Home from './pages/Home.tsx';
import PanelAdmin from './pages/panelAdmin.tsx';
import './Styles/Styles.css';


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
          <Route index element={<EncuestasPage />} />
          <Route path="crear" element={<CrearEncuesta />} />
          <Route path="completar" element={<EncuestasPage />} />
        </Route>
        <Route path="estadisticas" element={<EstadisticasPage />} />
        <Route path="cuenta" element={<CuentaPage />} />
        <Route path="admin" element={<PanelAdmin />} />
      </Route>
    </Routes>
  );
};

export default App;
