import React, { useState } from 'react';
import axios from 'axios';

const CrearEncuesta: React.FC = () => {
  const [titulo, setTitulo] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const encuestaData = {
        titulo: titulo,
        descripcion: descripcion
      };

      await axios.post('http://localhost:8000/encuestas', encuestaData);
      
      // Limpiar formulario después de enviar
      setTitulo('');
      setDescripcion('');
      
    } catch (error) {
      console.error('Error al crear encuesta:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Crear Nueva Encuesta</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="titulo">Título:</label>
          <input
            type="text"
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', }}
            rows={4}
          />
        </div>

        <button type="submit">
          Crear Encuesta
        </button>
      </form>
    </div>
  );
};

export default CrearEncuesta;