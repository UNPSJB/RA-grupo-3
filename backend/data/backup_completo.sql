PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE encuesta (
	id INTEGER NOT NULL, 
	titulo VARCHAR NOT NULL, 
	descripcion VARCHAR NOT NULL, 
	anio_carrera INTEGER, 
	cursada VARCHAR(7), 
	fecha_inicio DATETIME NOT NULL, 
	fecha_fin DATETIME, 
	esta_completa BOOLEAN NOT NULL, 
	estado VARCHAR(9) NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_encuesta_anio_carrera CHECK (anio_carrera BETWEEN 1 AND 6)
);
CREATE TABLE secciones (
	id INTEGER NOT NULL, 
	nombre VARCHAR(100) NOT NULL, 
	encuesta_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(encuesta_id) REFERENCES encuesta (id)
);
CREATE TABLE preguntas (
	id INTEGER NOT NULL, 
	texto VARCHAR(500) NOT NULL, 
	tipo VARCHAR(15) NOT NULL, 
	seccion_id INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(seccion_id) REFERENCES secciones (id)
);
CREATE TABLE opciones (
	id INTEGER NOT NULL, 
	texto VARCHAR(255) NOT NULL, 
	pregunta_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(pregunta_id) REFERENCES preguntas (id)
);
CREATE TABLE respuestas (
	id INTEGER NOT NULL, 
	texto TEXT, 
	opcion_id INTEGER, 
	pregunta_id INTEGER NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(opcion_id) REFERENCES opciones (id), 
	FOREIGN KEY(pregunta_id) REFERENCES preguntas (id)
);
CREATE INDEX ix_encuesta_descripcion ON encuesta (descripcion);
CREATE INDEX ix_encuesta_titulo ON encuesta (titulo);
CREATE INDEX ix_encuesta_id ON encuesta (id);
CREATE INDEX ix_secciones_id ON secciones (id);
CREATE INDEX ix_preguntas_id ON preguntas (id);
CREATE INDEX ix_opciones_id ON opciones (id);
CREATE INDEX ix_respuestas_id ON respuestas (id);
COMMIT;
