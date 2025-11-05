import React from 'react';

/**
 * Componente Footer para el Sistema de Encuestas.
 * Muestra información de copyright y enlaces útiles.
 * Utiliza Tailwind CSS para los estilos.
 */
const Footer: React.FC = () => {
  // Obtiene el año actual dinámicamente
  const currentYear = new Date().getFullYear();

  return (
    // 'mt-auto' es útil si el layout principal es un flex-col con min-h-screen
    // para empujar el footer al fondo en páginas con poco contenido.
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          
          {/* Sección de Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm text-slate-600">
              &copy; {currentYear} Universidad Nacional de la Patagonia San Juan Bosco.
              {/* Salto de línea en móvil, en la misma línea en pantallas grandes */}
              <span className="block sm:ml-2 sm:inline">
                Todos los derechos reservados.
              </span>
            </p>
          </div>

          {/* Sección de Enlaces */}
          <div className="flex justify-center space-x-6 mt-4 md:mt-0">
            <a
                href="https://es.wikipedia.org/wiki/Correo_electr%C3%B3nico"
            //   href="mailto:soporte.encuestas@unpsjb.edu.ar"
              className="text-sm text-slate-600 hover:text-blue-700 hover:underline transition-colors duration-200"
            >
              Contacto de Soporte
            </a>
            <a
              href="/privacidad" // Deberías crear esta ruta en tu app
              className="text-sm text-slate-600 hover:text-blue-700 hover:underline transition-colors duration-200"
            >
              Política de Privacidad
            </a>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
