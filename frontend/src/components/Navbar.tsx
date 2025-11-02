import React from "react";

import logoUnpsjb from "../img/Logo50Color_conletras.png"

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  return (
    <nav className="bg-white shadow-md w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Contenedor principal de la navbar, centrado horizontalmente */}
        <div className="flex justify-center items-center h-20">
          
          {/* Enlace principal que envuelve el logo y el título, dirige a la raíz "/" */}
          <a href="/" className="flex items-center gap-4 no-underline">
            
            {}
            {/* Asegúrate de que la ruta de la imagen sea correcta.
              Usar "src="/Logo50Color_conletras.jpg" asume que la imagen
              se encuentra en la carpeta 'public' de tu proyecto React.
            */}
            <img 
              className="h-16 w-auto" // Ajusta la altura (h-16) según necesites
              src={logoUnpsjb} 
            />
            {/* Línea divisora vertical */}
            <div className="w-px h-12 bg-gray-300"></div>
            
            {/* Título del sistema */}
            <span className="text-3xl font-semibold text-gray-800">
              Sistema Encuestas UNPSJB
            </span>
            
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

