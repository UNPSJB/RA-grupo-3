# Reporte Académico para una Facultad
## Descripcion
El proyecto se enmarca en el desarrollo de un sistema de reportes académicos para la Facultad de Ingeniería, con el objetivo de permitir la visualización de indicadores de gestión, a partir de la administración de diferentes instrumentos de relevamiento, como encuestas para estudiantes e informes de cátedra.
### Integrantes:
* Marcelo Rodriguez
* Augusto Coria
* Emiliano Necul

## Requisitos Precvios
* **Python** (v3.10 o superior) 
*  **Node.js** (v18 o superior) y **npm** 
*  **Git**
---

## ⚙️ Configuración del Backend
### 1. Entorno Virtual e Instalación
Navega a la carpeta del backend, crea un entorno virtual y activarlo:

    cd backend
    python -m venv .venv

    # Activar (windows)
    venv\Scripts\activate

    # Activar (Linux/Mac)
    source .venv/bin/activate

**Instala las dependencias necesarias**

    pip install -r requirements.txt

### 2. Variables de Entorno (.env)
Crea un arvhico llamado `.env` dentro de la carpeta `/backend` este archivo es esencial para la configuración de la base de datos.
**Contenido de `/backend/.env`:**

    # Configuracion de Base de Datos 
    (SQLite para desarrollo local)
    
    DB_URL=///./sql_app.db
    
    # Configuración del entorno (Opcional)
    
    ENV=dev
### 3. Ejecución del Servidor
Para iniciar el servidor de desarrollo FastAPI:

    # Asegúrate de estar en el directorio /backend y 
    con el entorno virtual activado.
    
    uvicorn src.main:app --reload
El backend estará corriendo en http://localhost:8000
La documentación interactiva de la API se puede ver en http://localhost:8000/docs

### 🗄️ Carga de Base de Datos (Scripts de Test)
Para poblar la base de datos con usuarios, materias y datos históricos coherentes, debes ejecutar los scripts de "seeding" en un **orden específico**.

**Importante:** Ejecuta estos comandos desde la **raíz del proyecto** (no dentro de la carpeta `backend`), asegurándote de tener el entorno virtual de Python activado.

### Orden de Ejecución:

**Datos Estructurales (Obligatorio):** Crea sedes, departamentos, carreras, materias, profesores y alumnos base.

    python -m backend.src.seed_data

**Plantillas de Encuestas (Obligatorio):** Crea las preguntas, secciones y estructuras de los formularios (Encuestas e Informes).

    python -m backend.src.seed_plantilla
**Historial Inteligente (Recomendado para Demos):** Genera un historial de cursadas pasadas (2022-2024), encuestas cerradas y respuestas de profesores con texto realista y porcentajes autocalculados.

    python -m backend.src.seed_responses

**Nota:** Si deseas reiniciar la base de datos desde cero, simplemente borra el archivo `backend/sql_app.db` y vuelve a ejecutar los scripts en el orden indicado.

---

### 💻 Configuración del Frontend

**1. Instalación de Dependencias.**
Navega a la carpeta del frontend e instala los paquetes necesarios:

    cd frontend
    npm install
**2. Variables de Entorno (.env)**
Crea un archivo llamado `.env` dentro de la carpeta `/frontend`. Esto conecta la aplicación React con tu backend local.

**Contenido de `/frontend/.env`**

    VITE_API_URL=http://localhost:8000

**3. Ejecución del Cliente**
Inicia el servidor de desarrollo de Vite:

    npm run dev
La aplicación estará disponible generalmente en http://localhost:5173

---
### 🔐 Usuarios de Prueba
Los scripts de carga eneran los siguientes usuarios por defecto,
**Contraseña para todos: `123456`**
|rol| Usuario | Descripción |
|--|--|--|
| Alumno | alumno1 ... alumno10 | Estudiantes inscriptos en materias |
| Profesor | profesor1 | Profesor de Informática |
| Profesor | profesor2 | Profesor de Matemáticas |
| Profesor | profesor3 | Profesor de Sistemas |
|  Admin Dpto  |  departamento  | Jefeoo del departamento de Informática  |
| Secretaría  |  admin_sec  |  Personal de Secretaría Acarémica  |
