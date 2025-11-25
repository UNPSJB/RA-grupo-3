import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import logoUnpsjb from "../img/Logo50Color_conletras.png";
import { useAuth } from "../auth/AuthContext";

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  // 1. Obtenemos datos y logout del contexto
  // Nota: fullName debe haber sido agregado al AuthContext en el paso anterior.
  // Si no, usará el username como respaldo.
  const { token, username, role, fullName, logout } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 2. Efecto para cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 3. Lógica para determinar la ruta de gestión según el rol
  const getGestionPath = (role: string) => {
    switch (role) {
      case "ALUMNO":
        return "/alumno/gestion";
      case "DOCENTE":
        return "/profesores/gestion";
      case "ADMIN_DEPARTAMENTO":
        return "/departamento/gestion";
      case "ADMIN_SECRETARIA":
        return "/secretaria/gestion";
      default:
        return "/";
    }
  };

  const navContainerClass = token
    ? "flex justify-between items-center h-20"
    : "flex justify-center items-center h-20";

  return (
    // Agregamos z-50 relative para que el dropdown quede por encima de otros elementos
    <nav className="bg-white shadow-md w-full relative z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={navContainerClass}>
          
          {/* --- LOGO --- */}
          <a href="/" className="flex items-center gap-4 no-underline">
            <img className="h-16 w-auto" src={logoUnpsjb} alt="Logo UNPSJB" />
            <div className="w-px h-12 bg-gray-300"></div>
            <span className="text-3xl font-semibold text-gray-800">
              Sistema Encuestas
            </span>
          </a>

          {/* --- MENÚ DE USUARIO (DROPDOWN) --- */}
          {token && username && role && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
              >
                {/* Texto: Nombre y Rol */}
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-bold text-gray-800">
                    {fullName || username}{" "}
                    <span className="font-normal text-gray-500">
                      ({username})
                    </span>
                  </span>
                  <span className="block text-xs text-indigo-600 font-semibold capitalize mt-0.5">
                    {role.toLowerCase().replace("_", " ")}
                  </span>
                </div>

                {/* Icono SVG */}
                <div className="bg-gray-100 p-2 rounded-full text-gray-600 shadow-sm border border-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
                
                {/* Flechita pequeña indicadora */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* --- CONTENIDO DEL DROPDOWN --- */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 focus:outline-none animate-fadeIn">
                  {/* Header móvil (opcional, si se oculta el texto en pantallas muy chicas) */}
                  <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">{username}</p>
                    <p className="text-xs text-gray-500 truncate">{role}</p>
                  </div>

                  <Link
                    to={getGestionPath(role)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Gestión de Cuenta
                  </Link>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;