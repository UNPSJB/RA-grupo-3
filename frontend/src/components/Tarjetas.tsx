import React from 'react';


const UsersIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);


// --- Props para la Tarjeta ---
export interface TarjetaProps {
  icon?: React.ReactNode;
  text: string;
  onClick?: () => void; // Prop opcional para hacerla clickeable
  className?: string;
}

/**
 * Componente de Tarjeta reutilizable con un icono y texto.
 */
export const Tarjeta: React.FC<TarjetaProps> = ({ icon, text, onClick, className = "" }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      // Estilo tailwind
      className={`
        flex flex-col items-center justify-center
        group
        min-h-[8rem]
        w-full
        gap-4
        rounded-2xl
        border border-blue-100
        bg-white
        p-6
        text-blue-700
        shadow-lg
        transition-all duration-300
        ease-in-out
        hover:-translate-y-1
        hover:border-blue-300
        hover:shadow-2xl
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-opacity-50
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
    >
      {/* Contenedor del Icono */}
      {icon && (
        <div className="text-blue-600 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      )}
      
      {/* Contenedor del Texto */}
      <p className="text-lg font-semibold text-gray-800">
        {text}
      </p>
    </button>
  );
};


/**
 * Componente Principal de la Aplicación
 * Renderiza la tarjeta de "Alumnos" en el centro de la pantalla.
 */
export const Tarjetas: React.FC = () => {
  
  const handleAlumnosClick = () => {
    // Aquí puedes poner la lógica para cuando se haga click
    console.log("Tarjeta de Alumnos clickeada");
  };

  return (
    // Contenedor para centrar la tarjeta en la pantalla
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 font-sans">
      
      <Tarjeta
        text="Alumnos"
        onClick={handleAlumnosClick}
        icon={
          // Le pasamos el icono como un elemento JSX
          // Ajustamos el tamaño del icono aquí
          <UsersIcon className="w-16 h-16" />
        }
      />

    </div>
  );
};
