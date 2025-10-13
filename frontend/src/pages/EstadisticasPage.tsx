import Grafico from '../components/estadisticas/Grafico.tsx';
import SectionBreakdownTable from '../components/estadisticas/SectionBreakdownTable.tsx';
import OptionTotalsSummary from '../components/estadisticas/OptionTotalsSummary.tsx';

const EstadisticasPage = () => (
  <section className="w-full max-w-7xl mx-auto px-6 md:px-10 xl:px-16 py-10 space-y-10">
    <header className="space-y-1">
      <h2 className="text-2xl font-semibold text-gray-800">Estadísticas</h2>
      <p className="text-sm text-gray-600">
        Visualización de resultados y porcentajes obtenidos por sección.
      </p>
    </header>
    <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-start">
      <div className="flex flex-col gap-6">
        <Grafico />
      </div>
      <div className="flex flex-col gap-6">
        <OptionTotalsSummary />
      </div>
      <div className="xl:col-span-2">
        <SectionBreakdownTable />
      </div>
    </div>
  </section>
);

export default EstadisticasPage;
