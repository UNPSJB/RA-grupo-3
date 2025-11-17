import React from "react";
import { Outlet, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import Footer from "./components/Footer.tsx";
import EncuestasPage from "./pages/EncuestasPage.tsx";
import CuentaPage from "./pages/CuentaPage.tsx";
import ResponderEncuesta from "./pages/ResponderEncuesta.tsx";
import CrearPlantilla from "./pages/CrearPlantilla.tsx";
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
import LoginPage from "./pages/LoginPage.tsx";
import ProtectedRoute from "./auth/ProtectedRoute.tsx";
import RedirectHome from "./auth/RedirectHome.tsx";

// ... (MainLayout y withLoading HOCs no cambian)
const MainLayout: React.FC = () => {
  const location = useLocation();
  const showNavMenu = location.pathname.startsWith("/alumno");
  const showSecretariaNavMenu = location.pathname.startsWith("/secretaria");
  const showProfesorNavMenu = location.pathname.startsWith("/profesores");
  // --- CAMBIO: El menú de Departamento se muestra en la ruta /departamento ---
  const showDepartamentoNavMenu = location.pathname.startsWith("/departamento");

  return (
    <div className="app min-h-screen flex flex-col">
      <header className="w-full">
        <Navbar />
        {showNavMenu && <NavigationMenu />}
        {showSecretariaNavMenu && <SecretariaAcademicaNavigationMenu />}
        {showProfesorNavMenu && <ProfesorNavigationMenu />}
        {/* --- CAMBIO: Renderizar el menú de Departamento --- */}
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
const LoginPageWithLoading = withLoading(LoginPage);

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<RedirectHome />} />
        <Route path="login" element={<LoginPageWithLoading />} />
        <Route path="privacidad" element={<PoliticasPrivacidadWithLoading />} />

        {/* --- Rutas de Secretaria --- */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN_SECRETARIA"]} />}>
          <Route path="secretaria" element={<Outlet />}>
            <Route index element={<PanelAdminWithLoading />} />
            <Route path="modelos" element={<SecretariaModelosWithLoading />} />
            <Route
              path="gestion"
              element={<GestionCuentasWithLoading />}
            />{" "}
            <Route path="plantillas" element={<Outlet />}>
              <Route index element={<Navigate to="borradores" replace />} />
              <Route path="borradores" element={<EncuestasPageWithLoading />} />
              <Route path="publicadas" element={<EncuestasPageWithLoading />} />
              <Route path="crear" element={<CrearPlantillaWithLoading />} />
            </Route>
          </Route>
        </Route>

        {/* --- Rutas de Alumno  --- */}
        <Route element={<ProtectedRoute allowedRoles={["ALUMNO"]} />}>
          <Route path="alumno" element={<Outlet />}>
            <Route index element={<ListaEncuestasAlumnosWithLoading />} />
            <Route path="gestion" element={<GestionCuentasWithLoading />} />
            <Route path="encuestas" element={<Outlet />}>
              <Route index element={<ListaEncuestasAlumnosWithLoading />} />
              <Route path="ver" element={<VerEncuestasWithLoading />} />
              <Route
                path="instancia/:instanciaId/responder"
                element={<ResponderEncuestaWithLoading />}
              />
            </Route>
          </Route>
        </Route>

        {/* --- Rutas de Profesor --- */}
        <Route element={<ProtectedRoute allowedRoles={["DOCENTE"]} />}>
          <Route path="profesores" element={<Outlet />}>
            <Route index element={<ProfesoresHomeWithLoading />} />
            <Route path="reportes" element={<Outlet />}>
              <Route
                path="instancia/:instanciaId/responder"
                element={<ResponderReportesWithLoading />}
              />
            </Route>
            <Route
              path="resultados"
              element={<ResultadosProfesorPageWithLoading />}
            />
            <Route path="gestion" element={<GestionCuentasWithLoading />} />
          </Route>
        </Route>

        {/* --- Rutas de Departamento --- */}
        <Route
          element={<ProtectedRoute allowedRoles={["ADMIN_DEPARTAMENTO"]} />}
        >
          <Route path="departamento" element={<Outlet />}>
            {/* Aquí irán los componentes de "Informes Sintéticos" */}
            <Route
              index
              element={
                <div className="p-6 text-xl">
                  Panel de Departamento (Ver Informes Sintéticos)
                </div>
              }
            />
            <Route path="gestion" element={<GestionCuentasWithLoading />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};
export default App;
