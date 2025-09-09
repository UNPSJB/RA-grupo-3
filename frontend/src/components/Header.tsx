import React from 'react';

// Opcional: Define una interfaz para las props si el Header las necesita.
interface HeaderProps {
  title?: string;
  // Puedes agregar más props aquí, por ejemplo:
  // onButtonClick?: () => void;
}

/**
 * Un componente de encabezado reutilizable para la aplicación.
 * @param {HeaderProps} props - Las propiedades para el componente Header.
 * @returns {React.ReactElement} El elemento del encabezado renderizado.
 */
export const Header: React.FC<HeaderProps> = ({ title = 'Mi Aplicación' }) => {
  return (
    <header style={{ 
        backgroundColor: '#0a562eff',
        padding: '10px',
        color: 'white',
        flex: '10px'
        }}>
      <h1>{title}</h1>
      <nav>
        {/* Aquí puedes agregar tus enlaces de navegación */}
      </nav>
    </header>
  );
};