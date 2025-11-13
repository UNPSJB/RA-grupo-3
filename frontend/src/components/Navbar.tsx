import React from "react";
import logoUnpsjb from "../img/Logo50Color_conletras.png";
import { useAuth } from "../auth/AuthContext";

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  const { token, username, role } = useAuth();

  // <--- CAMBIO 1: Lógica para centrar dinámicamente ---
  // Si hay un token, usamos 'justify-between' para hacer espacio.
  // Si NO hay token, usamos 'justify-center' para centrar el logo.
  const navContainerClass = token
    ? "flex justify-between items-center h-20" // Logueado
    : "flex justify-center items-center h-20"; // No logueado

  return (
    <nav className="bg-white shadow-md w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* <--- CAMBIO 2: Aplicar la clase dinámica --- */}
        <div className={navContainerClass}>
          
          {/* Logo y Título (siempre se muestra) */}
          <a href="/" className="flex items-center gap-4 no-underline">
            <img 
              className="h-16 w-auto"
              src={logoUnpsjb} 
              alt="Logo UNPSJB"
            />
            <div className="w-px h-12 bg-gray-300"></div>
            <span className="text-3xl font-semibold text-gray-800">
              Sistema Encuestas
            </span>
          </a>

          {/* Bloque de Información de Usuario (Sólo si hay token) */}
          {/* Como este bloque solo se renderiza si 'token' existe,
            el 'justify-between' del CAMBIO 1 funcionará correctamente,
            empujando este bloque a la derecha.
          */}
          {token && username && role && (
            <div className="text-right">
              <span className="text-sm font-medium text-gray-800">
                {username}
              </span>
              <span className="block text-xs text-gray-500 capitalize">
                ({role.toLowerCase()})
              </span>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;