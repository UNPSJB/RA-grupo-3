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
import DepartamentoEstadisticas from "./pages/DepartamentoEstadisticas.tsx";
import DepartamentoEstadisticasCursadas from "./pages/DepartamentoEstadisticasCursadas.tsx";
import DepartamentoInformesPage from "./pages/DepartamentoInformesPage.tsx";
import HistorialEncuestas from "./pages/HistorialEncuestas";
import ResponderInforme from "./pages/ResponderInforme"; 

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
const DepartamentoEstadisticasWithLoading = withLoading(
  DepartamentoEstadisticas
);
const DepartamentoEstadisticasCursadasWithLoading = withLoading(
  DepartamentoEstadisticasCursadas
);
const DepartamentoInformesPageWithLoading = withLoading(
  DepartamentoInformesPage
);
const HistorialEncuestasWithLoading = withLoading(HistorialEncuestas);

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<RedirectHome />} />
        <Route path="login" element={<LoginPageWithLoading />} />
        <Route path="privacidad" element={<PoliticasPrivacidadWithLoading />} />

        {/* --- Rutas de Secretaria  --- */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN_SECRETARIA"]} />}>
          <Route path="secretaria" element={<Outlet />}>
            {/* HOME: Ahora apunta al Panel Admin que tenía los accesos rápidos */}
            <Route index element={<PanelAdminWithLoading />} />

            {/* GESTIÓN DE PLANTILLAS */}
            <Route path="modelos" element={<SecretariaModelosWithLoading />} />
            <Route path="plantillas" element={<Outlet />}>
              <Route index element={<Navigate to="borradores" replace />} />
              <Route path="borradores" element={<EncuestasPageWithLoading />} />
              <Route path="publicadas" element={<EncuestasPageWithLoading />} />
              <Route path="crear" element={<CrearPlantillaWithLoading />} />
            </Route>

            {/* ESTADÍSTICAS Y CUENTA */}
            <Route
              path="estadisticas"
              element={
                <div className="p-6">Página de Estadísticas (Secretaría)</div>
              }
            />
            <Route
              path="otros"
              element={<div className="p-6">Página de Otros (Secretaría)</div>}
            />
            <Route path="gestion" element={<GestionCuentasWithLoading />} />
          </Route>
        </Route>

        {/* --- Rutas de Alumno (Protegidas) --- */}
        <Route element={<ProtectedRoute allowedRoles={["ALUMNO"]} />}>
          <Route path="alumno" element={<Outlet />}>
            <Route index element={<ListaEncuestasAlumnosWithLoading />} />
            <Route path="gestion" element={<GestionCuentasWithLoading />} />
            <Route
              path="historial"
              element={<HistorialEncuestasWithLoading />}
            />
            <Route path="encuestas" element={<Outlet />}>
              <Route index element={<ListaEncuestasAlumnosWithLoading />} />
              <Route path="ver" element={<VerEncuestasWithLoading />} />
              <Route
                path="instancia/:instanciaId/responder"
                element={<ResponderEncuestaWithLoading />}
              />
            </Route>{" "}
          </Route>{" "}
        </Route>
        {/* --- Rutas de Profesor (Protegidas) --- */}
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

        {/* --- Rutas de Departamento (FINAL: Solo Informes y Stats) --- */}
        <Route
          element={<ProtectedRoute allowedRoles={["ADMIN_DEPARTAMENTO"]} />}
        >
          <Route path="departamento" element={<Outlet />}>
            {/* HOME: Lista de Informes Sintéticos/Completados */}
            <Route index element={<DepartamentoInformesPageWithLoading />} />

            <Route
              path="/departamento/informe-sintetico/:instanciaId"
              element={<ResponderInforme />}
            />

            {/* ESTADÍSTICAS / INFORMES */}
            <Route
              path="estadisticas"
              element={<DepartamentoEstadisticasWithLoading />}
            />
            <Route
              path="estadisticas-cursadas"
              element={<DepartamentoEstadisticasCursadasWithLoading />}
            />

            {/* GESTIÓN */}
            <Route path="gestion" element={<GestionCuentasWithLoading />} />

            <Route
              path="admin"
              element={<Navigate to="/departamento" replace />}
            />
            <Route
              path="modelos"
              element={<Navigate to="/departamento/estadisticas" replace />}
            />
            <Route
              path="plantillas/*"
              element={<Navigate to="/departamento/estadisticas" replace />}
            />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};
export default App;
