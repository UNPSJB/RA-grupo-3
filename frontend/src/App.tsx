import React from "react";
import { Outlet, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import EncuestasPage from "./pages/EncuestasPage.tsx";
import EstadisticasPage from "./pages/EstadisticasPage.tsx";
import CuentaPage from "./pages/CuentaPage.tsx";
import ResponderEncuesta from "./pages/ResponderEncuesta.tsx";
import CrearEncuesta from "./pages/CrearEncuesta.tsx";
import Home from "./pages/Home.tsx";
import PanelAdmin from "./pages/panelAdmin.tsx";
import ListaEncuestasAlumnos from "./pages/ListaEncuestasAlumnos.tsx";
import VerEncuestas from "./pages/VerEncuestas.tsx";
import GestionPerfil from "./pages/GestionPerfil.tsx";
import NavigationMenu from "./components/icons/NavigationMenu.tsx";
import AlumnoHome from "./pages/AlumnoHome.tsx";
import ResultadosProfesorPage from "./pages/ResultadosProfesorPage.tsx";




const MainLayout: React.FC = () => {
  const location = useLocation();
  const showNavMenu = location.pathname.startsWith('/alumno');

  return (
    <div className="app">  
      <header className="w-full">
        <Navbar />
        {showNavMenu && <NavigationMenu />}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

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
        <Route path="alumno" element={<Outlet />}>
          <Route index element={<AlumnoHome />} />
          <Route path="encuestas" element={<ListaEncuestasAlumnos />} />
          <Route path="encuestas/ver" element={<VerEncuestas />} />
          <Route path="perfil/gestion" element={<GestionPerfil />} />
          <Route
            path="encuestas/instancia/:instanciaId/responder"
            element={<ResponderEncuesta />}
          />
        </Route>
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
