import React from "react";
import { Outlet, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import Footer from "./components/Footer.tsx";
import EncuestasPage from "./pages/EncuestasPage.tsx";

import CuentaPage from "./pages/CuentaPage.tsx";
import ResponderEncuesta from "./pages/ResponderEncuesta.tsx";
import CrearPlantilla from "./pages/CrearPlantilla.tsx";
import Home from "./pages/Home.tsx";
import PanelAdmin from "./pages/panelAdmin.tsx";
import ListaEncuestasAlumnos from "./pages/ListaEncuestasAlumnos.tsx";
import VerEncuestas from "./pages/VerEncuestas.tsx";
import NavigationMenu from "./components/NavigationMenu.tsx";
import SecretariaAcademicaNavigationMenu from "./components/NavigationMenuSecretaria.tsx";
import ProfesorNavigationMenu from "./components/NavigationMenuProfesores.tsx";
import DepartamentoNavigationMenu from "./components/NavigationMenuDepartamento.tsx";
import ResultadosProfesorPage from "./pages/ResultadosProfesorPage.tsx";
import SecretariaModelos from "./pages/SecretariaModelos.tsx";
import ProfesoresHome from "./pages/ProfesoresHome.tsx";
import PoliticasPrivacidad from "./pages/PoliticasPrivacidad.tsx";
import ResponderReportes from "./pages/ResponderReportes.tsx";
import GestionCuentas from "./pages/GestionCuentas.tsx";

const MainLayout: React.FC = () => {
  const location = useLocation();
  const showNavMenu = location.pathname.startsWith("/alumno");
  const showSecretariaNavMenu = location.pathname.startsWith("/secretaria");
  const showProfesorNavMenu = location.pathname.startsWith("/profesores");
  const showDepartamentoNavMenu = location.pathname.startsWith("/departamento");

  return (
    <div className="app min-h-screen flex flex-col">
      <header className="w-full">
        <Navbar />
        {showNavMenu && <NavigationMenu />}
        {showSecretariaNavMenu && <SecretariaAcademicaNavigationMenu />}
        {showProfesorNavMenu && <ProfesorNavigationMenu />}
        {showDepartamentoNavMenu && <DepartamentoNavigationMenu />}
      </header>
      <main className="app-main flex-grow  bg-[#f1f5f9] ">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        {/* --- Rutas de politica de privacidad --- */}
        <Route path="privacidad" element={<PoliticasPrivacidad />} />
       
        {/* --- Rutas de Secretaria --- */}
        <Route path="secretaria" element={<Outlet />}>
          {" "}
          {/* Agrupa rutas admin */}
          <Route path="modelos" element={<SecretariaModelos />} />
          <Route path="otros" element={<Outlet />} />{" "}
          {/*ACA NO HAY NADA PARA PONER AUN*/}
          {/* <Route path="estadisticas" element={<EstadisticasPage />} /> */}
          <Route path="gestion" element={<CuentaPage />} />
          <Route index element={<PanelAdmin />} />
          <Route path="plantillas" element={<Outlet />}>
            {" "}
            {/* Rutas para gestionar plantillas */}
            <Route index element={<Navigate to="borradores" replace />} />{" "}
            <Route path="borradores" element={<EncuestasPage />} />
            <Route path="publicadas" element={<EncuestasPage />} />
            <Route path="crear" element={<CrearPlantilla />} />{" "}
          </Route>
        </Route>


        {/* --- Rutas de Alumno --- */}
        <Route path="alumno" element={<Outlet />}>
          <Route index element={<ListaEncuestasAlumnos />} />
          <Route path="gestion" element={<GestionCuentas />} />
          {/*<Route
            path="/alumno/encuestas-abiertas/instancia/:instanciaId/responder"
            element={<ResponderEncuesta />}
          />*/}
          <Route path="encuestas" element={<Outlet />}>
            <Route index element={<ListaEncuestasAlumnos />} />
            <Route path="ver" element={<VerEncuestas />} />
            <Route
              path="instancia/:instanciaId/responder" // Solo la parte que va después de /encuestas/
              element={<ResponderEncuesta />}
            />
          </Route>
        </Route>

        {/* --- Rutas de Profesor --- */}
        <Route path="profesores" element={<Outlet />}>
          <Route index element={<ProfesoresHome />} />
          {/* Ahora "reportes" es un layout que muestra la lista o el detalle */}
          <Route path="reportes" element={<Outlet />}>
            <Route index element={<ResultadosProfesorPage />} />
            <Route path="crear/:cursadaId" element={<ResponderReportes />} />
          </Route>
          <Route path="otros" element={<Outlet />} />{" "}
          {/*ACA NO HAY NADA PARA PONER AUN*/}
          {/* <Route path="estadisticas" element={<EstadisticasPage />} /> */}
          <Route path="gestion" element={<GestionCuentas />} />
        </Route>

        
        {/* --- Rutas de Secretaria Academica --- */}

        {/* <Route path="secretaria" element={<Outlet />}>
          <Route index element={<SecretariaHome />} />
          <Route path="modelos" element={<SecretariaModelos />} />
          <Route path="otros" element={<Outlet />} />{" "}
          
          <Route path="gestion" element={<GestionCuentas />} />
        </Route>
         */}
      </Route>
    </Routes>
  );
};
export default App;
