import React, { useState, useEffect } from 'react';

// --- Interfaces de Datos ---

interface SubjectData {
  id: string;
  name: string;
  completionValue: number;
  completionTotal: number;
}

// --- Datos Ficticios (Mock) ---

const MOCK_DATA: Record<string, SubjectData> = {
  general: {
    id: 'general',
    name: 'General',
    completionValue: 25,
    completionTotal: 100,
  },
  matematica: {
    id: 'matematica',
    name: 'Matemática',
    completionValue: 30,
    completionTotal: 50,
  },
  historia: {
    id: 'historia',
    name: 'Historia',
    completionValue: 15,
    completionTotal: 80,
  },
  literatura: {
    id: 'literatura',
    name: 'Literatura',
    completionValue: 75,
    completionTotal: 100,
  },
};

// Lista de materias para la tarjeta 3
const subjectList = [
  MOCK_DATA.matematica,
  MOCK_DATA.historia,
  MOCK_DATA.literatura,
];

// --- Componente de Gráfico (Reutilizado) ---

interface DonutChartProps {
  value: number;
  total: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ value, total }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  const size = 160; // Gráfico más grande
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (value / total));
  
  return (
    <div className="relative w-40 h-40 flex items-center justify-center my-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
        {/* Fondo */}
        <circle
          className="text-gray-200"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        {/* Progreso */}
        <circle
          className="text-blue-500 transition-all duration-300"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
      </svg>
      {/* Texto en el medio */}
      <span className="absolute text-3xl font-bold text-gray-800">
        {`${Math.round(percentage)}%`}
      </span>
    </div>
  );
};

// --- Tarjeta 1: Gráfico de Finalización ---

interface CompletionCardProps {
  title: string;
  value: number;
  total: number;
}

const CompletionCard: React.FC<CompletionCardProps> = ({ title, value, total }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-start h-full">
      <div className="text-sm font-medium text-gray-500 uppercase text-center">
        {title}
      </div>
      <DonutChart value={value} total={total} />
    </div>
  );
};

// --- Tarjeta 2: Tiempo Restante ---

interface TimeLeftCardProps {
  title: string;
  endDate: Date;
}

const TimeLeftCard: React.FC<TimeLeftCardProps> = ({ title, endDate }) => {
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysLeft(diffDays > 0 ? diffDays : 0);
  }, [endDate]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-start h-full">
      <div className="text-sm font-medium text-gray-500 uppercase text-center">
        {title}
      </div>
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="text-7xl font-bold text-gray-900 mt-4">
          {daysLeft}
        </div>
        <div className="text-lg text-gray-600">
          {daysLeft === 1 ? 'día restante' : 'días restantes'}
        </div>
      </div>
    </div>
  );
};

// --- Tarjeta 3: Lista de Materias ---

interface SubjectListCardProps {
  title: string;
  subjects: SubjectData[];
  selectedSubjectId: string;
  onSelectSubject: (id: string) => void;
}

const SubjectListCard: React.FC<SubjectListCardProps> = ({ title, subjects, selectedSubjectId, onSelectSubject }) => {
  
  const baseClasses = "p-3 rounded-lg text-left transition-colors w-full font-medium";
  const selectedClasses = "bg-blue-500 text-white shadow";
  const unselectedClasses = "bg-gray-100 hover:bg-gray-200 text-gray-800";

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col h-full">
      <div className="text-sm font-medium text-gray-500 uppercase text-center">
        {title}
      </div>
      <div className="flex flex-col space-y-2 mt-4 overflow-y-auto">
        {/* Botón General */}
        <button
          onClick={() => onSelectSubject('general')}
          className={`${baseClasses} ${selectedSubjectId === 'general' ? selectedClasses : unselectedClasses}`}
        >
          General
        </button>
        
        {/* Lista de Materias */}
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => onSelectSubject(subject.id)}
            className={`${baseClasses} ${selectedSubjectId === subject.id ? selectedClasses : unselectedClasses}`}
          >
            {subject.name}
          </button>
        ))}
      </div>
    </div>
  );
};


// --- Componente Principal de la Aplicación ---

export default function App() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('general');
  
  // Datos para la tarjeta 1, basados en la selección
  const selectedData = MOCK_DATA[selectedSubjectId] || MOCK_DATA.general;
  
  // Fecha de finalización (ejemplo)
  const endDate = new Date('2025-12-31T23:59:59');

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased">
      <div className="min-h-screen p-8 flex justify-center p-8">
        <div className="w-full max-w-5xl">
          
          {/* Cuadrícula responsiva */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tarjeta 2: Tiempo Restante */}
            <TimeLeftCard
              title="Período de Encuesta"
              endDate={endDate}
            />

            {/* Tarjeta 1: Gráfico */}
            <CompletionCard
              title={selectedData.name === 'General' ? 'Finalización General' : `Finalización ${selectedData.name}`}
              value={selectedData.completionValue}
              total={selectedData.completionTotal}
            />

            {/* Tarjeta 3: Selector de Materias */}
            <SubjectListCard
              title=""
              subjects={subjectList}
              selectedSubjectId={selectedSubjectId}
              onSelectSubject={setSelectedSubjectId}
            />

          </div>
        </div>
      </div>
    </div>
  );
}