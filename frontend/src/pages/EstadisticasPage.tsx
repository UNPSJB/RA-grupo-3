import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import Grafico from '../components/estadisticas/Grafico.tsx';
import {
  SectionBreakdown,
  OptionTotals,
  OpenResponsesSummary,
} from '../components/estadisticas/DataGrafico.tsx';
import {
  defaultSeriesPalette,
  type ChartDatum,
  type SeriesDescriptor,
} from '../components/estadisticas/chartData.ts';
import type { EstadisticasResumen } from '../types/estadisticas.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const normalizeLabel = (value: string) => value.trim().toLowerCase();

const StatCard: React.FC<{ label: string; value: number; helper?: string }> = ({
  label,
  value,
  helper,
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-2xl font-semibold text-gray-900">{value}</p>
    {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
  </div>
);

const EstadisticasPage: React.FC = () => {
  const [data, setData] = useState<EstadisticasResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { encuestaId } = useParams<{ encuestaId?: string }>();
  const isFilteredView = Boolean(encuestaId);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const endpoint = encuestaId
          ? `${API_BASE_URL}/estadisticas/encuestas/${encuestaId}`
          : `${API_BASE_URL}/estadisticas`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Encuesta no encontrada');
          }
          throw new Error(`Error ${response.status}`);
        }
        const payload: EstadisticasResumen = await response.json();
        if (isMounted) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [encuestaId]);

  const series = useMemo<SeriesDescriptor[]>(() => {
    if (!data) return [];
    const palette = defaultSeriesPalette;
    const map = new Map<string, SeriesDescriptor>();
    let colorIndex = 0;

    data.secciones.forEach((section) => {
      section.opciones.forEach((option) => {
        const key = normalizeLabel(option.texto);
        if (!map.has(key)) {
          map.set(key, {
            key,
            label: option.texto,
            color: palette[colorIndex % palette.length],
          });
          colorIndex += 1;
        }
      });
    });

    return Array.from(map.values());
  }, [data]);

  const chartData = useMemo<ChartDatum[]>(() => {
    if (!data) return [];

    return data.secciones.map((section) => {
      const row: ChartDatum = { name: section.nombre };
      series.forEach((serie) => {
        const match = section.opciones.find(
          (option) => normalizeLabel(option.texto) === serie.key,
        );
        row[serie.key] = match?.total ?? 0;
      });
      return row;
    });
  }, [data, series]);

  if (loading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-6 md:px-10 xl:px-16 py-10 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Estadísticas</h2>
        <p className="text-sm text-gray-500">Cargando datos...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-7xl mx-auto px-6 md:px-10 xl:px-16 py-10 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Estadísticas</h2>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar las estadísticas: {error}
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-6 md:px-10 xl:px-16 py-10 space-y-10">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-gray-800">Estadísticas</h2>
        <p className="text-sm text-gray-600">
          {isFilteredView
            ? 'Resultados correspondientes a la encuesta seleccionada.'
            : 'Visualización en tiempo real de respuestas registradas en la plataforma.'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Respuestas totales"
          value={data.total_respuestas}
          helper="Incluye preguntas cerradas y abiertas"
        />
        <StatCard
          label="Respuestas de opción múltiple"
          value={data.total_respuestas_opciones}
        />
      </div>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-start">
        <div className="flex flex-col gap-6">
          <Grafico data={chartData} series={series} />
        </div>
        <div className="flex flex-col gap-6">
          <OptionTotals
            totals={data.opciones_totales}
            totalResponses={data.total_respuestas_opciones}
          />
        </div>
        <div className="xl:col-span-2">
          <SectionBreakdown
            sections={data.secciones}
            series={series}
            normalizer={normalizeLabel}
          />
        </div>
      </div>

      <OpenResponsesSummary sections={data.secciones} />
    </section>
  );
};

export default EstadisticasPage;
