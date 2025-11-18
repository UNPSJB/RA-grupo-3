import React from 'react';
import TarjetasInfo from '../components/TarjetasInfo.tsx';
import DashboardWidgets from '../components/DashboardWidgets.tsx';

const ProfesoresHome: React.FC = () => {
  return (
    // max-w-6xl mantiene todo alineado y centrado
    <div className="container mx-auto px-4 py-10 max-w-6xl">

      {/* Fila 1: Widgets Rectangulares (Grid 2 cols) */}
      <DashboardWidgets />
      
      {/* Fila 2: Tarjetas Cuadradas/Verticales (Grid 3 cols) */}
      <TarjetasInfo />
    </div>
  );
};

export default ProfesoresHome;