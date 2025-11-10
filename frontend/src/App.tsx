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
import withLoading from "./components/withLoading.tsx";

import ListaReportesProfesores from "./pages/ListaReportesProfesores.tsx";

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

const PoliticasPrivacidadWithLoading = withLoading(PoliticasPrivacidad);
const SecretariaModelosWithLoading = withLoading(SecretariaModelos);
const CuentaPageWithLoading = withLoading(GestionCuentas);
const PanelAdminWithLoading = withLoading(PanelAdmin);
const EncuestasPageWithLoading = withLoading(EncuestasPage);
const CrearPlantillaWithLoading = withLoading(CrearPlantilla);
const ListaEncuestasAlumnosWithLoading = withLoading(ListaEncuestasAlumnos);
const GestionCuentasWithLoading = withLoading(GestionCuentas);
const VerEncuestasWithLoading = withLoading(VerEncuestas);
const ResponderEncuestaWithLoading = withLoading(ResponderEncuesta);
const ProfesoresHomeWithLoading = withLoading(ProfesoresHome);
const ResultadosProfesorPageWithLoading = withLoading(ResultadosProfesorPage);
const ResponderReportesWithLoading = withLoading(ResponderReportes);

const ListaReportesProfesoresWithLoading = withLoading(ListaReportesProfesores);

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        {/* --- Rutas de politica de privacidad --- */}
        <Route path="privacidad" element={<PoliticasPrivacidadWithLoading />} />

        {/* --- Rutas de Secretaria --- */}
        <Route path="secretaria" element={<Outlet />}>
          {" "}
          {/* Agrupa rutas admin */}
          <Route path="modelos" element={<SecretariaModelosWithLoading />} />
          <Route path="otros" element={<Outlet />} />{" "}
          {/*ACA NO HAY NADA PARA PONER AUN*/}
          {/* <Route path="estadisticas" element={<EstadisticasPage />} /> */}
          <Route path="gestion" element={<CuentaPageWithLoading />} />
          <Route index element={<PanelAdminWithLoading />} />
          <Route path="plantillas" element={<Outlet />}>
            {" "}
            {/* Rutas para gestionar plantillas */}
            <Route index element={<Navigate to="borradores" replace />} />{" "}
            <Route path="borradores" element={<EncuestasPageWithLoading />} />
            <Route path="publicadas" element={<EncuestasPageWithLoading />} />
            <Route path="crear" element={<CrearPlantillaWithLoading />} />{" "}
          </Route>
        </Route>

        {/* --- Rutas de Alumno --- */}
        <Route path="alumno" element={<Outlet />}>
          <Route index element={<ListaEncuestasAlumnosWithLoading />} />
          <Route path="gestion" element={<GestionCuentasWithLoading />} />
          {/*<Route
            path="/alumno/encuestas-abiertas/instancia/:instanciaId/responder"
            element={<ResponderEncuesta />}
          />*/}
          <Route path="encuestas" element={<Outlet />}>
            <Route index element={<ListaEncuestasAlumnosWithLoading />} />
            <Route path="ver" element={<VerEncuestasWithLoading />} />
            <Route
              path="instancia/:instanciaId/responder" // Solo la parte que va después de /encuestas/
              element={<ResponderEncuestaWithLoading />}
            />
          </Route>
        </Route>

        {/* === 3. BLOQUE DE RUTAS DE PROFESOR CORREGIDO === */}
        <Route path="profesores" element={<Outlet />}>
          <Route index element={<ProfesoresHomeWithLoading />} />

          <Route path="reportes" element={<Outlet />}>
            {/* '/profesores/reportes' AHORA MUESTRA LA LISTA DE REPORTES PENDIENTES */}
            <Route index element={<ListaReportesProfesoresWithLoading />} />

            {/* ESTA ES LA RUTA PARA RESPONDER UN REPORTE (LA QUE NECESITABAS) */}
            <Route
              path="instancia/:instanciaId/responder"
              element={<ResponderReportesWithLoading />}
            />
          </Route>

          {/* ESTA ES LA NUEVA RUTA PARA VER LOS RESULTADOS DE ENCUESTAS CERRADAS */}
          <Route
            path="resultados"
            element={<ResultadosProfesorPageWithLoading />}
          />

          <Route path="gestion" element={<GestionCuentasWithLoading />} />
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
