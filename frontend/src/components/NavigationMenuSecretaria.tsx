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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-700 hover:text-blue-600 flex items-center px-6 py-2 text-base font-medium"
        type="button"
      >
        <span>{title}</span>
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-700 hover:text-blue-600 flex items-center justify-between px-3 py-2 rounded-md text-base font-medium w-full"
        type="button"
      >
        <span>{title}</span>
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
      {isOpen && <div className="pl-4 mt-1 space-y-1">{children}</div>}
    </div>
  );
};

interface NavigationMenuProps {}

const NavigationMenuSecretaria: React.FC<NavigationMenuProps> = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <nav className="bg-white shadow-md w-full border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end md:justify-center items-center py-3">
          <div className="md:hidden"></div>

          <div className="hidden md:flex md:items-center divide-x divide-gray-200">
            <Link
              to="/secretaria"
              className="text-gray-700 hover:text-blue-600 px-6 py-2 text-base font-medium"
            >
              Dashboard
            </Link>

            <DesktopDropdown title="Plantillas">
              <DropdownItem to="/secretaria/plantillas/borradores">
                Borradores
              </DropdownItem>
              <DropdownItem to="/secretaria/plantillas/publicadas">
                Publicadas
              </DropdownItem>
              <DropdownItem to="/secretaria/plantillas/crear">
                Crear
              </DropdownItem>
            </DesktopDropdown>

            <DesktopDropdown title="Encuestas">
              
              <DropdownItem to="/secretaria/CicloVida">
                Configurar Ciclos
              </DropdownItem>
              <DropdownItem to="/secretaria/plazos"> {/* Nuevo link */}
                Ver Plazos Vigentes
              </DropdownItem>
              {/* <DropdownItem to="/secretaria/estadisticas">
                Estadisticas
              </DropdownItem> */}
            </DesktopDropdown>

          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/secretaria"
              className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
            >
              Dashboard
            </Link>

            <MobileDropdown title="Plantillas">
              <DropdownItem to="/secretaria/plantillas/borradores">
                Borradores
              </DropdownItem>
              <DropdownItem to="/secretaria/plantillas/publicadas">
                Publicadas
              </DropdownItem>
              <DropdownItem to="/secretaria/plantillas/crear">
                Crear
              </DropdownItem>
            </MobileDropdown>

            <MobileDropdown title="Encuestas">
              <DropdownItem to="/secretaria/CicloVida">
                Configurar Ciclos
              </DropdownItem>
              <DropdownItem to="/secretaria/plazos">
                Ver Plazos Vigentes
              </DropdownItem>
              <DropdownItem to="/secretaria/estadisticas">
                Estadisticas
              </DropdownItem>
            </MobileDropdown>

            <MobileDropdown title="Mi Perfil">
              <DropdownItem to="/secretaria/gestion">Gestión</DropdownItem>
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
      {/* --- FIN MENÚ MÓVIL --- */}
    </nav>
  );
};

export default NavigationMenuSecretaria;
