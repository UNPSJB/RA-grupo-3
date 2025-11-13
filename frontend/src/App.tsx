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

import LoginPage from "./pages/LoginPage.tsx"
import ProtectedRoute from "./auth/ProtectedRoute.tsx";

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
const LoginPageWithLoading = withLoading(LoginPage); 


const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        
        {/* --- NUEVA RUTA DE LOGIN --- */}
        {/* La ponemos fuera de las rutas protegidas */}
        <Route path="login" element={<LoginPageWithLoading />} /> 
        
        <Route path="privacidad" element={<PoliticasPrivacidadWithLoading />} />

        {/* --- RUTAS PROTEGIDAS --- */}
        
        {/* --- Rutas de Secretaria (Protegidas) --- */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="secretaria" element={<Outlet />}>
            {/* ... (todas tus rutas de secretaria anidadas aquí) ... */}
            <Route path="modelos" element={<SecretariaModelosWithLoading />} />
            <Route path="gestion" element={<CuentaPageWithLoading />} />
            <Route index element={<PanelAdminWithLoading />} />
            <Route path="plantillas" element={<Outlet />}>
              <Route index element={<Navigate to="borradores" replace />} />
              <Route path="borradores" element={<EncuestasPageWithLoading />} />
              <Route path="publicadas" element={<EncuestasPageWithLoading />} />
              <Route path="crear" element={<CrearPlantillaWithLoading />} />
            </Route>
          </Route>
        </Route>

        {/* --- Rutas de Alumno (Protegidas) --- */}
        <Route element={<ProtectedRoute allowedRoles={["ALUMNO"]} />}>
          <Route path="alumno" element={<Outlet />}>
            {/* ... (todas tus rutas de alumno anidadas aquí) ... */}
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

        {/* --- Rutas de Profesor (Protegidas) --- */}
        <Route element={<ProtectedRoute allowedRoles={["DOCENTE"]} />}>
          <Route path="profesores" element={<Outlet />}>
            {/* ... (todas tus rutas de profesor anidadas aquí) ... */}
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
        
        {/* (Opcional) Una ruta genérica para 'gestion' si es compartida */}
        {/* <Route element={<ProtectedRoute allowedRoles={["ALUMNO", "DOCENTE", "ADMIN"]} />}>
           <Route path="gestion" element={<GestionCuentasWithLoading />} />
        </Route>
        */}
        
      </Route>
    </Routes>
  );
};
export default App;


// LO VIEJO

// const App: React.FC = () => {
//   return (
//     <Routes>
//       <Route path="/" element={<MainLayout />}>
//         <Route index element={<Home />} />
//         {/* --- Rutas de politica de privacidad --- */}
//         <Route path="privacidad" element={<PoliticasPrivacidadWithLoading />} />

//         {/* --- Rutas de Secretaria --- */}
//         <Route path="secretaria" element={<Outlet />}>
//           {" "}
//           {/* Agrupa rutas admin */}
//           <Route path="modelos" element={<SecretariaModelosWithLoading />} />
//           <Route path="otros" element={<Outlet />} />{" "}
//           {/*ACA NO HAY NADA PARA PONER AUN*/}
//           {/* <Route path="estadisticas" element={<EstadisticasPage />} /> */}
//           <Route path="gestion" element={<CuentaPageWithLoading />} />
//           <Route index element={<PanelAdminWithLoading />} />
//           <Route path="plantillas" element={<Outlet />}>
//             {" "}
//             {/* Rutas para gestionar plantillas */}
//             <Route index element={<Navigate to="borradores" replace />} />{" "}
//             <Route path="borradores" element={<EncuestasPageWithLoading />} />
//             <Route path="publicadas" element={<EncuestasPageWithLoading />} />
//             <Route path="crear" element={<CrearPlantillaWithLoading />} />{" "}
//           </Route>
//         </Route>

//         {/* --- Rutas de Alumno --- */}
//         <Route path="alumno" element={<Outlet />}>
//           <Route index element={<ListaEncuestasAlumnosWithLoading />} />
//           <Route path="gestion" element={<GestionCuentasWithLoading />} />
//           {/*<Route
//             path="/alumno/encuestas-abiertas/instancia/:instanciaId/responder"
//             element={<ResponderEncuesta />}
//           />*/}
//           <Route path="encuestas" element={<Outlet />}>
//             <Route index element={<ListaEncuestasAlumnosWithLoading />} />
//             <Route path="ver" element={<VerEncuestasWithLoading />} />
//             <Route
//               path="instancia/:instanciaId/responder" // Solo la parte que va después de /encuestas/
//               element={<ResponderEncuestaWithLoading />}
//             />
//           </Route>
//         </Route>

//         {/* === 3. BLOQUE DE RUTAS DE PROFESOR CORREGIDO === */}
//         <Route path="profesores" element={<Outlet />}>
//           <Route index element={<ProfesoresHomeWithLoading />} />

//           <Route path="reportes" element={<Outlet />}>
//             {/* SE MANTIENE LA RUTA PARA RESPONDER */}
//             <Route
//               path="instancia/:instanciaId/responder"
//               element={<ResponderReportesWithLoading />}
//             />
//           </Route>

//           {/* RUTA PARA VER LOS RESULTADOS */}
//           <Route
//             path="resultados"
//             element={<ResultadosProfesorPageWithLoading />}
//           />

//           <Route path="gestion" element={<GestionCuentasWithLoading />} />
//         </Route>
//       </Route>
//     </Routes>
//   );
// };
// export default App;
