-- Script para poblar data/app.db con una única encuesta publicada
-- que ya cuenta con múltiples respuestas simuladas.
--
-- Ejecutar desde el directorio backend:
--   sqlite3 data/app.db < scripts/seed_encuesta_unica.sql

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- Limpiar datos existentes
DELETE FROM respuestas;
DELETE FROM opciones;
DELETE FROM preguntas;
DELETE FROM secciones;
DELETE FROM encuesta;

-- Encuesta principal
INSERT INTO encuesta (
    id,
    titulo,
    descripcion,
    anio_carrera,
    cursada,
    fecha_inicio,
    fecha_fin,
    esta_completa,
    estado
) VALUES (
    1,
    'Encuesta de Experiencia Estudiantil 2024',
    'Relevamiento anual sobre satisfacción con la carrera y los servicios ofrecidos.',
    2,
    'primero',
    '2024-05-01 08:00:00',
    '2024-05-31 23:59:00',
    1,
    'publicada'
);

-- Secciones de la encuesta
INSERT INTO secciones (id, nombre, encuesta_id) VALUES
    (1, 'Calidad docente', 1),
    (2, 'Infraestructura y servicios', 1);

-- Preguntas (4 de múltiple opción y 2 abiertas)
INSERT INTO preguntas (id, texto, tipo, seccion_id) VALUES
    (1, '¿Cómo calificás la claridad de las explicaciones del equipo docente?', 'MULTIPLE_CHOICE', 1),
    (2, '¿Qué tan accesibles son los docentes para resolver dudas fuera de clase?', 'MULTIPLE_CHOICE', 1),
    (3, 'Comentá una mejora concreta que te gustaría ver en las clases.', 'REDACCION', 1),
    (4, '¿Cómo evaluarías el estado general de las aulas y laboratorios?', 'MULTIPLE_CHOICE', 2),
    (5, '¿Con qué frecuencia utilizás los servicios tecnológicos de la facultad (Wi-Fi, laboratorios, plataformas)?', 'MULTIPLE_CHOICE', 2),
    (6, 'Indicá la principal mejora que propondrías para la infraestructura.', 'REDACCION', 2);

-- Opciones para las preguntas de múltiple opción
INSERT INTO opciones (id, texto, pregunta_id) VALUES
    (1, 'Excelente', 1),
    (2, 'Muy buena', 1),
    (3, 'Aceptable', 1),
    (4, 'Debe mejorar', 1),
    (5, 'Siempre disponibles', 2),
    (6, 'Generalmente accesibles', 2),
    (7, 'Solo en horario de consulta', 2),
    (8, 'Difícil contactar', 2),
    (9, 'Modernas y en muy buen estado', 4),
    (10, 'Buenas pero con detalles a corregir', 4),
    (11, 'Necesitan mantenimiento urgente', 4),
    (12, 'Insuficientes para la demanda', 4),
    (13, 'A diario', 5),
    (14, 'Varias veces por semana', 5),
    (15, 'Ocasionalmente', 5),
    (16, 'Casi nunca', 5);

-- Respuestas simulando cinco estudiantes distintos
-- Estudiante 1
INSERT INTO respuestas (pregunta_id, opcion_id, texto, created_at) VALUES
    (1, 2, 'Muy buena', '2024-05-10 09:05:00'),
    (2, 5, 'Siempre disponibles', '2024-05-10 09:05:30'),
    (3, NULL, 'Más ejemplos prácticos en las clases teóricas.', '2024-05-10 09:06:10'),
    (4, 9, 'Modernas y en muy buen estado', '2024-05-10 09:06:40'),
    (5, 13, 'A diario', '2024-05-10 09:07:00'),
    (6, NULL, 'Agregar más enchufes y espacio en los laboratorios.', '2024-05-10 09:07:20');

-- Estudiante 2
INSERT INTO respuestas (pregunta_id, opcion_id, texto, created_at) VALUES
    (1, 3, 'Aceptable', '2024-05-12 15:20:00'),
    (2, 7, 'Solo en horario de consulta', '2024-05-12 15:20:25'),
    (3, NULL, 'Me gustaría que suban el material antes de cada clase.', '2024-05-12 15:21:05'),
    (4, 10, 'Buenas pero con detalles a corregir', '2024-05-12 15:21:30'),
    (5, 14, 'Varias veces por semana', '2024-05-12 15:21:55'),
    (6, NULL, 'Reemplazar proyectores antiguos en aulas grandes.', '2024-05-12 15:22:20');

-- Estudiante 3
INSERT INTO respuestas (pregunta_id, opcion_id, texto, created_at) VALUES
    (1, 1, 'Excelente', '2024-05-15 11:10:00'),
    (2, 6, 'Generalmente accesibles', '2024-05-15 11:10:25'),
    (3, NULL, 'Seguir reforzando las instancias de consulta personalizadas.', '2024-05-15 11:10:55'),
    (4, 9, 'Modernas y en muy buen estado', '2024-05-15 11:11:15'),
    (5, 13, 'A diario', '2024-05-15 11:11:35'),
    (6, NULL, 'Actualizar el mobiliario de las aulas de primer año.', '2024-05-15 11:11:55');

-- Estudiante 4
INSERT INTO respuestas (pregunta_id, opcion_id, texto, created_at) VALUES
    (1, 4, 'Debe mejorar', '2024-05-18 18:40:00'),
    (2, 8, 'Difícil contactar', '2024-05-18 18:40:20'),
    (3, NULL, 'Necesitamos más feedback sobre los trabajos prácticos.', '2024-05-18 18:40:55'),
    (4, 11, 'Necesitan mantenimiento urgente', '2024-05-18 18:41:15'),
    (5, 16, 'Casi nunca', '2024-05-18 18:41:35'),
    (6, NULL, 'Mejorar iluminación en pasillos y espacios de estudio.', '2024-05-18 18:41:55');

-- Estudiante 5
INSERT INTO respuestas (pregunta_id, opcion_id, texto, created_at) VALUES
    (1, 2, 'Muy buena', '2024-05-22 13:15:00'),
    (2, 6, 'Generalmente accesibles', '2024-05-22 13:15:20'),
    (3, NULL, 'Incorporar clases grabadas para repasar contenidos.', '2024-05-22 13:15:55'),
    (4, 10, 'Buenas pero con detalles a corregir', '2024-05-22 13:16:10'),
    (5, 15, 'Ocasionalmente', '2024-05-22 13:16:35'),
    (6, NULL, 'Más espacios con computadoras disponibles en horario nocturno.', '2024-05-22 13:16:55');

COMMIT;
