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
import NavigationMenu from "./components/NavigationMenu.tsx";
import SecretariaAcademicaNavigationMenu from "./components/NavigationMenuSecretaria.tsx";
import ProfesorNavigationMenu from "./components/NavigationMenuProfesores.tsx";
import DepartamentoNavigationMenu from "./components/NavigationMenuDepartamento.tsx"
import AlumnoHome from "./pages/AlumnoHome.tsx";
import ResultadosProfesorPage from "./pages/ResultadosProfesorPage.tsx";
import SecretariaHome from "./pages/SecretariaHome.tsx";
import SecretariaModelos from "./pages/SecretariaModelos.tsx";
import ProfesoresHome from "./pages/ProfesoresHome.tsx"




const MainLayout: React.FC = () => {
  const location = useLocation();
  const showNavMenu = location.pathname.startsWith('/alumno');
  const showSecretariaNavMenu = location.pathname.startsWith('/secretaria');
  const showProfesorNavMenu = location.pathname.startsWith('/profesores');
  const showDepartamentoNavMenu = location.pathname.startsWith('/departamento');


  return (
    <div className="app">  
      <header className="w-full">
        <Navbar />
        {showNavMenu && <NavigationMenu />}
        {showSecretariaNavMenu && <SecretariaAcademicaNavigationMenu />}
        {showProfesorNavMenu && <ProfesorNavigationMenu />}
        {showDepartamentoNavMenu && <DepartamentoNavigationMenu />}
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
        <Route path="departamento" element={<Outlet />}>
          {" "}
          {/* Agrupa rutas admin */}
          <Route path="modelos" element={<SecretariaModelos />} />
          <Route path="otros" element={<Outlet />} /> { /*ACA NO HAY NADA PARA PONER AUN*/ }
          <Route path="estadisticas" element={<EstadisticasPage />} />
          <Route path="gestion" element={<CuentaPage />} />
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
        <Route path="profesores" element={<Outlet />}>
          <Route index element={<ProfesoresHome />} />
          <Route path="reportes" element={<Outlet />} /> { /*ACA NO HAY NADA PARA PONER AUN*/ }
          <Route path="otros" element={<Outlet />} /> { /*ACA NO HAY NADA PARA PONER AUN*/ }
          <Route path="estadisticas" element={<EstadisticasPage />} />
          <Route path="gestion" element={<CuentaPage />} />
        </Route>
        {/* --- Rutas de Secretaria Academica --- */}
        <Route path="secretaria" element={<Outlet />}>
          <Route index element={<SecretariaHome />} />
          <Route path="modelos" element={<SecretariaModelos />} />
          <Route path="otros" element={<Outlet />} /> { /*ACA NO HAY NADA PARA PONER AUN*/ }
          <Route path="estadisticas" element={<EstadisticasPage />} />
          <Route path="gestion" element={<CuentaPage />} />
        </Route>
      </Route>
    </Routes>
  );
};
export default App;