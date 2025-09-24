import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';

// Tipos TypeScript
interface Opcion {
  texto: string;
}

interface PreguntaData {
  texto: string;
  tipo: 'REDACCION' | 'MULTIPLE_CHOICE';
  opciones: Opcion[];
}

const CrearPregunta: React.FC = () => {
  const [pregunta, setPregunta] = useState<PreguntaData>({
    texto: '',
    tipo: 'REDACCION',
    opciones: []
  });
  
  const [nuevaOpcion, setNuevaOpcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error', texto: string} | null>(null);

  // Agregar nueva opción
  const agregarOpcion = () => {
    if (nuevaOpcion.trim()) {
      setPregunta(prev => ({
        ...prev,
        opciones: [...prev.opciones, { texto: nuevaOpcion.trim() }]
      }));
      setNuevaOpcion('');
    }
  };

  // Eliminar opción
  const eliminarOpcion = (index: number) => {
    setPregunta(prev => ({
      ...prev,
      opciones: prev.opciones.filter((_, i) => i !== index)
    }));
  };

  // Cambiar tipo de pregunta
  const cambiarTipo = (nuevoTipo: 'REDACCION' | 'MULTIPLE_CHOICE') => {
    setPregunta(prev => ({
      ...prev,
      tipo: nuevoTipo,
      opciones: nuevoTipo === 'REDACCION' ? [] : prev.opciones
    }));
  };

  // Enviar pregunta al backend
  const enviarPregunta = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/preguntas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pregunta)
      });

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: '¡Pregunta creada exitosamente!' });
        // Limpiar formulario
        setPregunta({
          texto: '',
          tipo: 'REDACCION',
          opciones: []
        });
      } else {
        const errorData = await response.json();
        setMensaje({ 
          tipo: 'error', 
          texto: `Error: ${errorData.detail || 'No se pudo crear la pregunta'}` 
        });
      }
    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: 'Error de conexión. Verifica que tu backend esté ejecutándose.' 
      });
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="vh-100 vw-100 d-flex justify-content-center align-items-center bg-dark">
    <Card bg="dark" text="light" className="border-secondary shadow-lg p-4" style={{ width: "600px" }}>
      <Card.Header className="bg-dark border-secondary text-center">
        <h2 className="mb-0 text-light">Crear Nueva Pregunta</h2>
      </Card.Header>
      <Card.Body className="bg-dark">
        {mensaje && (
          <Alert variant={mensaje.tipo === 'success' ? 'success' : 'danger'}>
            {mensaje.texto}
          </Alert>
        )}

        <Form onSubmit={enviarPregunta} className="fs-5">
          {/* Texto de la pregunta */}
          <Form.Group className="mb-4">
            <Form.Label className="text-light fw-bold">Texto de la Pregunta *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={pregunta.texto}
              onChange={(e) => setPregunta(prev => ({ ...prev, texto: e.target.value }))}
              placeholder="Escribe aquí tu pregunta..."
              required
              className="bg-secondary text-light border-secondary"
            />
          </Form.Group>

          {/* Tipo de pregunta */}
          <Form.Group className="mb-4">
            <Form.Label className="text-light fw-bold">Tipo de Pregunta</Form.Label>
            <div>
              <Form.Check
                inline
                type="radio"
                label="Redacción"
                name="tipo"
                checked={pregunta.tipo === 'REDACCION'}
                onChange={() => cambiarTipo('REDACCION')}
                className="text-light"
              />
              <Form.Check
                inline
                type="radio"
                label="Múltiple Choice"
                name="tipo"
                checked={pregunta.tipo === 'MULTIPLE_CHOICE'}
                onChange={() => cambiarTipo('MULTIPLE_CHOICE')}
                className="text-light"
              />
            </div>
          </Form.Group>

          {/* Opciones */}
          {pregunta.tipo !== 'REDACCION' && (
            <Form.Group className="mb-4">
              <Form.Label className="text-light fw-bold">Opciones</Form.Label>
              <div className="d-flex mb-3">
                <Form.Control
                  type="text"
                  value={nuevaOpcion}
                  onChange={(e) => setNuevaOpcion(e.target.value)}
                  placeholder="Escribe una opción..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarOpcion())}
                  className="bg-secondary text-light border-secondary"
                />
                <Button 
                  variant="outline-light" 
                  className="ms-2"
                  onClick={agregarOpcion}
                  disabled={!nuevaOpcion.trim()}
                >
                  Agregar
                </Button>
              </div>

              {pregunta.opciones.map((opcion, index) => (
                <div key={index} className="d-flex align-items-center mb-2 p-2 bg-secondary rounded">
                  <Badge bg="light" text="dark" className="me-2">{index + 1}</Badge>
                  <span className="flex-grow-1 text-light">{opcion.texto}</span>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => eliminarOpcion(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </Form.Group>
          )}

          {/* Botón submit */}
          <div className="d-grid">
            <Button
              variant="light"
              type="submit"
              disabled={loading || !pregunta.texto.trim()}
              size="lg"
              className="text-dark fw-bold py-3"
            >
              {loading ? 'Creando pregunta...' : 'Crear Pregunta'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  </div>
);

};

export default CrearPregunta;