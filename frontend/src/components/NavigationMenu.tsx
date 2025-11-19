import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface DropdownItemProps {
  to: string;
  children: React.ReactNode;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ to, children }) => {
  return (
    <Link
      to={to}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      role="menuitem"
    >
      {children}
    </Link>
  );
};

interface DesktopDropdownProps {
  title: string;
  children: React.ReactNode;
}

const DesktopDropdown: React.FC<DesktopDropdownProps> = ({
  title,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Efecto para cerrar el dropdown si se hace clic fuera de él
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón del dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-700 hover:text-blue-600 flex items-center px-6 py-2 text-base font-medium"
        type="button"
      >
        <span>{title}</span>
        {/* Icono de flecha */}
        <svg
          className={`w-5 h-5 ml-1 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Contenido del dropdown (posicionado absoluto) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

interface MobileDropdownProps {
  title: string;
  children: React.ReactNode;
}

const MobileDropdown: React.FC<MobileDropdownProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Botón del acordeón */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-700 hover:text-blue-600 flex items-center justify-between px-3 py-2 rounded-md text-base font-medium w-full"
        type="button"
      >
        <span>{title}</span>
        {/* Icono de flecha */}
        <svg
          className={`w-5 h-5 ml-1 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Contenido del acordeón (inline) */}
      {isOpen && <div className="pl-4 mt-1 space-y-1">{children}</div>}
    </div>
  );
};

// --- Componente Principal del Menú de Navegación ---
interface NavigationMenuProps {}

const NavigationMenu: React.FC<NavigationMenuProps> = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  return (
    // Contenedor principal del menú.
    <nav className="bg-white shadow-md w-full border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Contenedor alineado a la derecha en móvil (justify-end) y centrado en desktop (md:justify-center) */}
        <div className="flex justify-end md:justify-center items-center py-3">
          {/* Botón de Menú Móvil (Hamburguesa) */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              {/* Icono de Hamburguesa (se transforma en X) */}
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="hidden md:flex md:items-center divide-x divide-gray-200">
            {/* Ejemplo de Enlace Simple */}
            <Link
              to="/alumno"
              className="text-gray-700 hover:text-blue-600 px-6 py-2 text-base font-medium"
            >
              Encuestas
            </Link>
            <Link
              to="/alumno/historial"
              className="text-gray-700 hover:text-blue-600 px-6 py-2 text-base font-medium"
            >
              Historial
            </Link>
            {/* Ejemplo de Menú de Usuario */}
            <DesktopDropdown title="Mi Perfil">
              <DropdownItem to="/alumno/gestion">Gestión</DropdownItem>
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                Cerrar Sesión
              </button>
            </DesktopDropdown>
          </div>
        </div>
      </div>

      {/* Menú Móvil (Se muestra al hacer clic en la hamburguesa) */}
      {/* Oculto en desktop (md:hidden) */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Ejemplo de Enlace Simple (Móvil) */}
            <Link
              to="/alumno"
              className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
            >
              Encuestas
            </Link>
            <Link
              to="/alumno/historial"
              className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
            >
              Historial
            </Link>
            {/* Ejemplo de Menú de Usuario (Móvil) */}
            <MobileDropdown title="Mi Perfil">
              <DropdownItem to="/alumno/gestion">Gestión</DropdownItem>
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                Cerrar Sesión
              </button>
            </MobileDropdown>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationMenu;
