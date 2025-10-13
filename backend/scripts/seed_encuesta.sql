-- Script de ejemplo para poblar la base SQLite con dos encuestas y seis preguntas por cada una
-- Ejecutar con: sqlite3 ../mi-db-sqlite.db < scripts/seed_encuesta.sql

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- Limpiar datos previos opcionales
DELETE FROM pregunta;
DELETE FROM encuesta;

-- Insertar encuestas de ejemplo
INSERT INTO encuesta (
    id,
    titulo,
    descripcion,
    anio_carrera,
    cursada,
    fecha_inicio,
    fecha_fin,
    esta_completa
) VALUES
    (
        1,
        'Encuesta de Satisfacción de Ingeniería',
        'Relevamiento sobre la experiencia estudiantil en Ingeniería Informática',
        2,
        'primero',
        '2024-03-01 09:00:00',
        '2024-03-15 23:59:00',
        0
    ),
    (
        2,
        'Encuesta de Servicios Estudiantiles',
        'Evaluación de los servicios de apoyo académico y bienestar estudiantil',
        1,
        'segundo',
        '2024-04-01 09:00:00',
        '2024-04-20 23:59:00',
        0
    );

-- Insertar preguntas asociadas (6 por encuesta)
INSERT INTO pregunta (id, seccion, descripcion, encuesta_id) VALUES
    (1, 1, '¿Qué tan satisfecho estás con el contenido de la cursada?', 1),
    (2, 1, '¿Considerás adecuada la carga horaria semanal?', 1),
    (3, 2, '¿Cómo evaluás la claridad de los docentes al explicar los temas?', 1),
    (4, 2, '¿Recibiste retroalimentación útil en las evaluaciones?', 1),
    (5, 3, '¿El material complementario fue suficiente para estudiar?', 1),
    (6, 3, '¿Recomendarías ajustes en la modalidad de evaluación?', 1),
    (7, 1, '¿Cómo calificarías la disponibilidad del servicio de tutorías?', 2),
    (8, 1, '¿Qué tan útiles te resultan los recursos de la biblioteca?', 2),
    (9, 2, '¿La comunicación de la Secretaría Académica es clara y oportuna?', 2),
    (10, 2, '¿Cómo evaluarías la calidad de los espacios de estudio?', 2),
    (11, 3, '¿Cómo evaluarías la atención del personal administrativo?', 2),
    (12, 3, '¿Qué servicio estudiantil consideras prioritario mejorar?', 2);

COMMIT;
