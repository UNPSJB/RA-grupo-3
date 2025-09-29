import React, { useState } from 'react';

const CrearEncuesta: React.FC = () => {
  const [titulo, setTitulo] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [anioCarrera, setAnioCarrera] = useState<string>('1');
  const [cursada, setCursada] = useState<string>('primero');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const encuestaData = {
        titulo: titulo,
        descripcion: descripcion,
        anio_carrera: parseInt(anioCarrera), // Convertir a número
        cursada: cursada
      };

      const response = await fetch('http://localhost:8000/encuestas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(encuestaData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      
      
      // Limpiar formulario después de enviar
      setTitulo('');
      setDescripcion('');
      setAnioCarrera('1');
      setCursada('primero');
      
      setMessage('Encuesta creada exitosamente!');
      
    } catch (error) {
      console.error('Error al crear encuesta:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Crear Nueva Encuesta</h2>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
          color: message.includes('Error') ? '#c62828' : '#2e7d32',
          border: `1px solid ${message.includes('Error') ? '#f44336' : '#4caf50'}`
        }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="titulo">Título:</label>
          <input
            type="text"
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            rows={4}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="anioCarrera">Año de Carrera:</label>
          <select
            id="anioCarrera"
            value={anioCarrera}
            onChange={(e) => setAnioCarrera(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="1">1° Año</option>
            <option value="2">2° Año</option>
            <option value="3">3° Año</option>
            <option value="4">4° Año</option>
            <option value="5">5° Año</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="cursada">Cursada:</label>
          <select
            id="cursada"
            value={cursada}
            onChange={(e) => setCursada(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="primero">Primer Cuatrimestre</option>
            <option value="segundo">Segundo Cuatrimestre</option>
            <option value="anual">Anual</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creando...' : 'Crear Encuesta'}
        </button>
      </form>
    </div>
  );
};

export default CrearEncuesta;