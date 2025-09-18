-- Script de ejemplo para poblar la base SQLite con una encuesta y seis preguntas
-- Ejecutar con: sqlite3 ../mi-db-sqlite.db < scripts/seed_encuesta.sql

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- Limpiar datos previos opcionales
DELETE FROM pregunta;
DELETE FROM encuesta;

-- Insertar encuesta de ejemplo
INSERT INTO encuesta (
    id,
    titulo,
    descripcion,
    anio_carrera,
    cursada,
    fecha_inicio,
    fecha_fin,
    esta_completa
) VALUES (
    1,
    'Encuesta de Satisfacción de Ingeniería',
    'Relevamiento sobre la experiencia estudiantil en Ingeniería Informática',
    2,
    'primero',
    '2024-03-01 09:00:00',
    '2024-03-15 23:59:00',
    0
);

-- Insertar preguntas asociadas
INSERT INTO pregunta (id, seccion, descripcion, encuesta_id) VALUES
    (1, 1, '¿Qué tan satisfecho estás con el contenido de la cursada?', 1),
    (2, 1, '¿Considerás adecuada la carga horaria semanal?', 1),
    (3, 2, '¿Cómo evaluás la claridad de los docentes al explicar los temas?', 1),
    (4, 2, '¿Recibiste retroalimentación útil en las evaluaciones?', 1),
    (5, 3, '¿Recomendarías esta materia a otros estudiantes?', 1),
    (6, 3, '¿Qué mejoras propondrías para la materia?', 1);

COMMIT;
