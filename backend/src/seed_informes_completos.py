import sys
import os
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session

# --- Configuración de Path ---
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(script_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

# --- IMPORTS DE MODELOS ---
from src.database import SessionLocal
from src.models import ModeloBase
from src.seccion.models import Seccion 
from src.pregunta.models import Pregunta, PreguntaRedaccion
from src.respuesta.models import RespuestaSet, RespuestaRedaccion, RespuestaMultipleChoice
from src.instrumento.models import ActividadCurricular, ActividadCurricularInstancia, InformeSintetico, InformeSinteticoInstancia
from src.encuestas.models import EncuestaInstancia, Encuesta, PeriodoEvaluacion
from src.materia.models import Materia, Cursada, Cuatrimestre, Departamento, Carrera, Sede
from src.persona.models import Profesor, Inscripcion, AdminDepartamento, Alumno
from src.enumerados import EstadoInforme, TipoInstrumento, TipoPregunta, TipoCuatrimestre, EstadoInstancia
from src.auth.services import get_password_hash

# --- DATOS REALES DEL PDF (PUERTO MADRYN) ---

INTEGRANTES_COMISION = "Carlos Buckle, Leonardo Ordinez, Francisco Páez, Rodrigo Tolosa, Lucas Abella, Joaquín Lima y Romina Stickar"

OBSERVACIONES_FINALES = """a) La cobertura lograda en las asignaturas y la percepción de logros alcanzados en el proceso de aprendizaje se considera muy buena.
b) Las encuestas de alumnos han arrojado resultados tendientes a Bueno Muy Bueno, de todas maneras hay aspectos mejorables que han sido detectados por las cátedras en los informes y para los cuales la mayoría propone estrategias alternativas para abordar los problemas.
c) Es URGENTE que se designe a un JTP para la asignatura Análisis y Diseño de Sistemas.
d) Se deja constancia que solo una minoría de docentes no realizan actividades diferentes a la docencia.
e) El 64% de los docentes del Departamento ha realizado tareas de capacitación. Se considera un muy buen porcentaje pero ha disminuido con respecto al año anterior.
f) Se sugiere agregar al Informe Anual de cátedra, que se informe la cantidad de horas dedicadas a capacitación, investigación, extensión y gestión."""

# --- BASE DE DATOS COMPLETA DE MATERIAS ---
MATERIAS_DEMO = [
    {
        "codigo": "IF001",
        "nombre": "Elementos de Informática",
        "alumnos": "100",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "Proyector con mejor conectividad. Pizarra blanca grande. Amplificador y parlantes.",
        "bibliografia": "Introducción a la computación (Sexta edición). Peter Norton.",
        "horas": "105/105",
        "contenido": "100%",
        "estrategias": "Optimización del uso del Moodle para repositorio de apuntes. Optimización del simulador MJ+.",
        "encuesta_stats": "B: 82% | C: 80% | ET: 92% | D: 87% | EP: 87%",
        "juicio": "Los índices se consideran muy buenos. En general se encuentran satisfechos con su experiencia.",
        "auxiliar": "Muy claro en sus explicaciones (Guillermo Swidzinski). Excelente manejo del portal (Fernando Tidona).",
        "profesor": "Jorge Dignani"
    },
    {
        "codigo": "IF002",
        "nombre": "Expresión de Problemas y Algoritmos",
        "alumnos": "74",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "Pizarras blancas grandes. Marcadores.",
        "bibliografia": "",
        "horas": "90/90",
        "contenido": "100%",
        "estrategias": "Complementar el trabajo presencial con actividades no presenciales en el aula virtual.",
        "encuesta_stats": "B: 92% | C: 86% | ET: 94% | D: 95% | EP: 85%",
        "juicio": "La cátedra valora la enumeración de aspectos positivos y a mejorar explicitados por los alumnos.",
        "auxiliar": "Cumple satisfactoriamente atribuciones y deberes de un JTP (Fernando Tidona).",
        "profesor": "Sandra Alvarez"
    },
    {
        "codigo": "IF004",
        "nombre": "Sistemas y Organizaciones",
        "alumnos": "25",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "Mejora en proyectores de video con mejor conectividad.",
        "bibliografia": "Teoria General de Sistemas. Dougglas Hurtado Carmona. Desarrollo de sistemas de información. Vicenç Fernández.",
        "horas": "90/90",
        "contenido": "100%",
        "estrategias": "Incorporar más práctica de técnicas de relevamiento. Orientar el aprendizaje basado en ejemplos cotidianos.",
        "encuesta_stats": "B: 96% | C: 72% | ET: 96% | D: 93% | EP: 100%",
        "juicio": "Solo hubo 9 encuestas procesadas. De los 25 inscriptos solo cursaron 15 ya que 10 abandonaron.",
        "auxiliar": "El docente fue de gran apoyo en el dictado de los trabajos Prácticos (Rodrigo Cura).",
        "profesor": "Carlos Nacher"
    },
    {
        "codigo": "IF005",
        "nombre": "Arquitectura de Computadoras",
        "alumnos": "28",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "Mejor conectividad a internet dentro de las aulas.",
        "bibliografia": "Essentials of Computer Architecture. Douglas E. Comer.",
        "horas": "120/120",
        "contenido": "100%",
        "estrategias": "Se buscará hacer aún más énfasis en que los alumnos dediquen mayor tiempo a la Cátedra.",
        "encuesta_stats": "B: 91% | C: 79% | ET: 97% | D: 80% | EP: 89%",
        "juicio": "Estos índices se consideran muy buenos. Porcentajes de opinión positiva aceptables.",
        "auxiliar": "Buena comunicación con los alumnos. Excelente administración del portal Moodle (Cristian Pacheco).",
        "profesor": "Jorge Dignani"
    },
    {
        "codigo": "IF006",
        "nombre": "Algorítmica y Programación II",
        "alumnos": "18",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "Actualización de los equipos del laboratorio de informática. Conectividad estable.",
        "bibliografia": "Agile software development (Martin). Test-driven development (Beck). Design Patterns (Gamma).",
        "horas": "120/120",
        "contenido": "100%",
        "estrategias": "Gestión con asignaturas pre y post-correlativas y la Coordinación del Departamento.",
        "encuesta_stats": "B: 89% | C: 67% | ET: 85% | D: 74% | EP: 83%",
        "juicio": "En particular las indicaciones respecto a una falta de interacción con materias previas hace años no ocurren.",
        "auxiliar": "Gran dedicación y predisposición a la incorporación de nuevos temas (Gustavo Samec).",
        "profesor": "Renato Mazzanti"
    },
    {
        "codigo": "IF009",
        "nombre": "Laboratorio de Programación y Lenguajes",
        "alumnos": "14",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "Marcadores, papel afiche, post-its.",
        "bibliografia": "",
        "horas": "90/90",
        "contenido": "100%",
        "estrategias": "Profundizar aspectos tecnológicos mediante ejecución de talleres específicos.",
        "encuesta_stats": "B: 78% (MB) | C: 58% (MB) | ET: 64% (MB) | D: 31% (B) | EP: 53% (MB)",
        "juicio": "Las encuestas reflejan que más del 83% de las respuestas son buenas y/o muy buenas.",
        "auxiliar": "Importante dedicación a la asignatura aportando ideas (Rodrigo Cura).",
        "profesor": "Damián Barry"
    },
    {
        "codigo": "IF010",
        "nombre": "Análisis y Diseño de Sistemas",
        "alumnos": "11",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "",
        "bibliografia": "Essentials of Software Engineering (Tsui). Requirements Engineering (Laplante).",
        "horas": "122/135",
        "contenido": "100%",
        "estrategias": "Continuar motivando el aprendizaje con propuestas pedagógicas innovadoras (videos, pósters).",
        "encuesta_stats": "B: 72% (MB) | C: 37% (MB) | ET: 28% (MB) | D: 50% (MB) | EP: 8% (MB)",
        "juicio": "En las encuestas se puso de manifiesto la falta de un docente para la parte práctica.",
        "auxiliar": "La cátedra necesita de forma URGENTE alcanzar una composición acorde (Falta JTP).",
        "profesor": "Leonardo Ordinez"
    },
    {
        "codigo": "IF011",
        "nombre": "Sistemas Operativos",
        "alumnos": "5",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "",
        "bibliografia": "Windows Internals (Russinovich). The Design of the UNIX OS (Bach).",
        "horas": "145/150",
        "contenido": "100%",
        "estrategias": "Agregar un control de resultados automatizado en los laboratorios.",
        "encuesta_stats": "B: 75% (MB) | C: 33% (MB) | ET: 0% (MB) | D: 50% (MB) | EP: 50% (MB)",
        "juicio": "Se ha recibido sólo 1 encuesta. Se considera una cantidad demasiado baja para ser representativa.",
        "auxiliar": "Fundamental apoyo en el dictado. Organizando laboratorios con sistemas embebidos (Francisco Páez).",
        "profesor": "Carlos Buckle"
    },
    {
        "codigo": "IF015",
        "nombre": "Ingeniería de Software",
        "alumnos": "4",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "Aula equipada con proyector.",
        "bibliografia": "",
        "horas": "150/150",
        "contenido": "85%",
        "estrategias": "Posibilidad de encarar un taller de programación en C de manera extracurricular.",
        "encuesta_stats": "B: 42% (MB) | C: 33% (MB) | ET: 33% (MB) | D: 33% (MB) | EP: 66% (MB)",
        "juicio": "Las encuestas han arrojado valores dominantes de Bueno o Muy Bueno en todas las variables.",
        "auxiliar": "Gran aporte en los Trabajos Prácticos. Importante dedicación (Leonardo Ordinez).",
        "profesor": "Damián Barry"
    },
    {
        "codigo": "IF017",
        "nombre": "Taller de Nuevas Tecnologías",
        "alumnos": "4",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "",
        "bibliografia": "The Linux Programming Interface. Building evolutionary architectures.",
        "horas": "90/90",
        "contenido": "100%",
        "estrategias": "Presentar más resúmenes y material de apoyo traducido al español.",
        "encuesta_stats": "B: 0% | C: 0% | ET: 0% | D: 0% | EP: 0% (No hay datos precisos)",
        "juicio": "Las encuestas reflejan que más del 88% de las respuestas son buenas.",
        "auxiliar": "",
        "profesor": "Diego Firmenich"
    },
    {
        "codigo": "IF018",
        "nombre": "Inteligencia Artificial",
        "alumnos": "1",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "",
        "bibliografia": "Inteligencia Artificial. Un enfoque moderno (Russell & Norvig).",
        "horas": "120/120",
        "contenido": "100%",
        "estrategias": "Recortar temas teóricos meramente informativos.",
        "encuesta_stats": "B: 12% (MB) | C: 50% (MB) | ET: 18% (MB) | D: 50% (B) | EP: 66% (MB)",
        "juicio": "La cátedra considera que son satisfactorios los resultados de las encuestas.",
        "auxiliar": "Excelente capacidad académica, predisposición y entusiasmo (Romina Stickar).",
        "profesor": "Claudio Delrieux"
    },
    {
        "codigo": "IF019",
        "nombre": "Redes y Trasmisión de Datos",
        "alumnos": "3",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "Proyector 3000 lúmenes o más, con salidas HDMI y VGA.",
        "bibliografia": "Redes de Computadoras. Un enfoque descendente (Kurose).",
        "horas": "135/135",
        "contenido": "100%",
        "estrategias": "Agregar actividades a distancia (videoconferencias, chatrooms).",
        "encuesta_stats": "B: 12% (MB) | C: 100% (MB) | ET: 25% (MB) | D: 50% (MB) | EP: 50% (MB)",
        "juicio": "Se completaron solo dos encuestas, con resultados muy satisfactorios.",
        "auxiliar": "Cumplió con lo especificado (Francisco Páez).",
        "profesor": "José Manuel Urriza"
    },
    {
        "codigo": "IF021",
        "nombre": "Arquitectura de Redes y Servicios",
        "alumnos": "4",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "",
        "bibliografia": "",
        "horas": "120/120",
        "contenido": "100%",
        "estrategias": "Mantener el curso siempre actualizado.",
        "encuesta_stats": "B: 25% (MB) | C: 0% (MB) | ET: 37% (B) | D: 16% (MB) | EP: 8% (MB)",
        "juicio": "El JTP hizo un trabajo excelente, fundamental cuando la Teoría es dictada por un Prof. Viajero.",
        "auxiliar": "Muy buena predisposición al trabajo académico (Fernando Pap).",
        "profesor": "Javier Echaiz"
    },
    {
        "codigo": "IF024",
        "nombre": "Informática Industrial",
        "alumnos": "5",
        "comisiones_t": "1",
        "comisiones_p": "1",
        "equipamiento": "4 Arduino Nano para laboratorio de instrumentación.",
        "bibliografia": "Material disponible en la web dada la falta de libros hard-copy.",
        "horas": "120/120",
        "contenido": "100%",
        "estrategias": "Profundizar en el armado de experiencias de laboratorio en primera persona.",
        "encuesta_stats": "B: 45% (MB) | C: 40% (MB) | ET: 25% (MB) | D: 43% (MB) | EP: 3% (MB)",
        "juicio": "En Evaluación, un alumno manifestó como Poco Satisfactoria la oferta de alternativas.",
        "auxiliar": "Este año ha progresado mucho en la autonomía (Ignacio Aita).",
        "profesor": "Federico Ares"
    }
]

def get_or_create_profesor(db: Session, nombre_completo: str) -> Profesor:
    username = nombre_completo.lower().replace(" ", ".")
    profesor = db.query(Profesor).filter(Profesor.username.like(f"{username}%")).first()
    if not profesor:
        profesor = Profesor(
            nombre=nombre_completo,
            username=username,
            hashed_password=get_password_hash("123456"),
            tipo="DOCENTE"
        )
        db.add(profesor)
        db.commit()
        db.refresh(profesor)
    return profesor

def responder_pregunta_texto(db: Session, rset_id: int, texto_pregunta_clave: list, respuesta_texto: str, preguntas_todas: list):
    """Busca una pregunta que contenga alguna de las claves y crea la respuesta."""
    if not respuesta_texto: return

    pregunta_encontrada = None
    for p in preguntas_todas:
        # Buscamos si ALGUNA clave está en el texto de la pregunta
        if any(clave.lower() in p.texto.lower() for clave in texto_pregunta_clave):
            pregunta_encontrada = p
            break
    
    if pregunta_encontrada:
        resp = RespuestaRedaccion(
            pregunta_id=pregunta_encontrada.id,
            respuesta_set_id=rset_id,
            tipo=TipoPregunta.REDACCION,
            texto=respuesta_texto
        )
        db.add(resp)

def seed_demo_pm(db: Session):
    print("\n🚀 Iniciando generación de DEMO PUERTO MADRYN COMPLETA (14 Materias)...")
    
    # 1. Configuración Base
    anio_actual = datetime.now().year
    sede_nombre = "Puerto Madryn"
    depto_nombre = "Depto. Informática (PM)"
    
    # --- Asegurar Sede ---
    sede = db.scalars(select(Sede).where(Sede.localidad == sede_nombre)).first()
    if not sede:
        sede = Sede(localidad=sede_nombre)
        db.add(sede)
        db.commit()
        db.refresh(sede)
        print(f"   + Sede '{sede_nombre}' creada.")

    # --- Asegurar Departamento ---
    depto = db.scalars(select(Departamento).where(Departamento.nombre == depto_nombre)).first()
    if not depto:
        depto = Departamento(nombre=depto_nombre, sede_id=sede.id)
        db.add(depto)
        db.commit()
        db.refresh(depto)
        print(f"   + Departamento '{depto_nombre}' creado.")

    # --- Asegurar Carrera ---
    # Buscamos la carrera globalmente antes del loop para evitar errores
    carrera_nombre = "Licenciatura en Informática (PM)"
    carrera = db.scalars(select(Carrera).where(Carrera.nombre == carrera_nombre)).first()
    if not carrera:
        carrera = Carrera(nombre=carrera_nombre, departamento_id=depto.id)
        db.add(carrera)
        db.commit()
        print(f"   + Carrera '{carrera.nombre}' creada.")

    # --- Asegurar Usuario Admin ---
    # CAMBIO: Verificar si ya existe un admin para este departamento por ID
    admin_existente = db.query(AdminDepartamento).filter_by(departamento_id=depto.id).first()
    
    if admin_existente:
        print(f"   + Usuario Admin ya existente para el departamento (PM): {admin_existente.username}")
    else:
        # Si no existe, lo creamos (usando 'admin_pm' para consistencia con seed_data.py)
        username_admin = "admin_pm"
        admin_new = AdminDepartamento(
            nombre="Director Depto Madryn",
            username=username_admin,
            hashed_password=get_password_hash("123456"),
            departamento_id=depto.id,
            tipo="ADMIN_DEPARTAMENTO"
        )
        db.add(admin_new)
        db.commit()
        print(f"   + Usuario '{username_admin}' creado.")

    # --- Cuatrimestre ---
    cuatri = db.query(Cuatrimestre).filter_by(anio=anio_actual, periodo=TipoCuatrimestre.PRIMERO).first()
    if not cuatri:
        cuatri = Cuatrimestre(anio=anio_actual, periodo=TipoCuatrimestre.PRIMERO)
        db.add(cuatri)
        db.commit()

    # --- Plantillas ---
    plantilla_ac = db.scalars(
        select(ActividadCurricular)
        .where(ActividadCurricular.tipo == TipoInstrumento.ACTIVIDAD_CURRICULAR)
    ).first()
    
    plantilla_sintetico = db.scalars(
        select(InformeSintetico)
        .where(InformeSintetico.tipo == TipoInstrumento.INFORME_SINTETICO)
    ).first()

    if not plantilla_ac or not plantilla_sintetico:
        print("❌ Error: Faltan plantillas. Ejecuta seed_plantilla.py.")
        return

    db.refresh(plantilla_ac)
    preguntas_ac = [p for s in plantilla_ac.secciones for p in s.preguntas]

    # --- CORRECCIÓN CLAVE: Asegurar Periodo de Evaluación ---
    # Esto es necesario porque EncuestaInstancia ahora tiene una foreign key NO NULA hacia PeriodoEvaluacion
    periodo = db.query(PeriodoEvaluacion).filter_by(nombre="Periodo Demo 2025").first()
    if not periodo:
        print("   + Creando Periodo de Evaluación Dummy...")
        periodo = PeriodoEvaluacion(
            nombre="Periodo Demo 2025",
            fecha_inicio_encuesta=datetime.now(),
            fecha_fin_encuesta=datetime.now(),
            fecha_limite_informe=datetime.now(),
            fecha_limite_sintetico=datetime.now()
        )
        db.add(periodo)
        db.commit()
        db.refresh(periodo)

    informes_creados = []

    print(f"   Procesando {len(MATERIAS_DEMO)} materias...")
    
    for dato in MATERIAS_DEMO:
        # a. Materia
        # CORRECCIÓN: Buscar por código para evitar duplicados o no-encontrados por mayúsculas/minúsculas
        materia = db.query(Materia).filter(Materia.codigo == dato["codigo"]).first()
        
        if not materia:
            # CORRECCIÓN: Agregar campo codigo al crear
            materia = Materia(
                nombre=dato["nombre"], 
                codigo=dato["codigo"], 
                descripcion=f"Código PDF: {dato['codigo']}"
            )
            db.add(materia)
            db.commit()
        
        if materia not in carrera.materias:
            carrera.materias.append(materia)
            db.commit()

        # b. Profesor
        profesor = get_or_create_profesor(db, dato["profesor"])

        # c. Cursada
        cursada = db.query(Cursada).filter_by(
            materia_id=materia.id, cuatrimestre_id=cuatri.id, profesor_id=profesor.id
        ).first()
        if not cursada:
            cursada = Cursada(
                materia_id=materia.id, cuatrimestre_id=cuatri.id, profesor_id=profesor.id
            )
            db.add(cursada)
            db.commit()
        
        # Dummy Inscripciones
        cant_actual = db.query(Inscripcion).filter_by(cursada_id=cursada.id).count()
        if cant_actual == 0:
             alumno_dummy = db.query(Alumno).first()
             if not alumno_dummy:
                 alumno_dummy = Alumno(nombre="Alumno Dummy", username="alumno.dummy", hashed_password="x", tipo="ALUMNO")
                 db.add(alumno_dummy)
                 db.commit()
             insc = Inscripcion(alumno_id=alumno_dummy.id, cursada_id=cursada.id, ha_respondido=True)
             db.add(insc)
             db.commit()

        # d. Encuesta Dummy Cerrada
        enc_inst = db.query(EncuestaInstancia).filter_by(cursada_id=cursada.id).first()
        if not enc_inst:
             plantilla_enc = db.query(Encuesta).first()
             if plantilla_enc:
                enc_inst = EncuestaInstancia(
                    cursada_id=cursada.id, 
                    plantilla_id=plantilla_enc.id,
                    periodo_evaluacion_id=periodo.id, # <--- CAMBIO: Asignar ID del periodo
                    estado=EstadoInstancia.CERRADA, 
                    fecha_inicio=datetime.now(), 
                    fecha_fin=datetime.now()
                )
                db.add(enc_inst)
                db.commit()
        
        if not enc_inst: continue 

        # e. INFORME DE CÁTEDRA (ACI)
        aci = db.query(ActividadCurricularInstancia).filter_by(cursada_id=cursada.id).first()
        if aci:
             db.query(RespuestaSet).filter(RespuestaSet.instrumento_instancia_id == aci.id).delete()
             db.delete(aci)
             db.commit()

        aci = ActividadCurricularInstancia(
            actividad_curricular_id=plantilla_ac.id,
            cursada_id=cursada.id,
            encuesta_instancia_id=enc_inst.id,
            profesor_id=profesor.id,
            estado=EstadoInforme.COMPLETADO,
            tipo=TipoInstrumento.ACTIVIDAD_CURRICULAR,
            fecha_inicio=datetime.now(),
            fecha_fin=datetime.now()
        )
        db.add(aci)
        db.commit()

        # f. LLENAR RESPUESTAS
        rset = RespuestaSet(instrumento_instancia_id=aci.id)
        db.add(rset)
        db.commit()

        # --- RESPUESTAS SECCIÓN 0 (AGREGADO) ---
        responder_pregunta_texto(db, rset.id, ["alumnos inscriptos"], dato["alumnos"], preguntas_ac)
        responder_pregunta_texto(db, rset.id, ["comisiones de clases teóricas", "clases teóricas"], dato["comisiones_t"], preguntas_ac)
        responder_pregunta_texto(db, rset.id, ["comisiones de clases prácticas", "clases prácticas"], dato["comisiones_p"], preguntas_ac)

        # Seccion 1
        responder_pregunta_texto(db, rset.id, ["equipamiento", "insumos"], dato["equipamiento"], preguntas_ac)
        responder_pregunta_texto(db, rset.id, ["bibliografía", "bibliografia"], dato["bibliografia"], preguntas_ac)
        
        # Seccion 2 (Horas)
        responder_pregunta_texto(db, rset.id, ["teóricas dictadas"], dato["horas"], preguntas_ac) 
        responder_pregunta_texto(db, rset.id, ["prácticas dictadas"], dato["horas"], preguntas_ac)
        # --- AGREGADO: Justificación ---
        responder_pregunta_texto(db, rset.id, ["justificación"], "Sin justificación requerida", preguntas_ac)
        
        # Seccion 2.A (Contenidos)
        responder_pregunta_texto(db, rset.id, ["contenidos planificados"], dato["contenido"], preguntas_ac)
        responder_pregunta_texto(db, rset.id, ["estrategias propuestas"], dato["estrategias"], preguntas_ac)

        # Seccion 2.B (Encuestas + Juicio)
        texto_2b = f"Resultados Encuesta:\n{dato['encuesta_stats']}\n\nJuicio de Valor:\n{dato['juicio']}"
        responder_pregunta_texto(db, rset.id, ["juicio de valor", "2.b"], texto_2b, preguntas_ac)
        
        # Seccion 2.C
        responder_pregunta_texto(db, rset.id, ["aspectos positivos"], "El grupo tuvo un avance progresivo. Buena comunicación.", preguntas_ac)

        # Seccion 3
        texto_actividades = "Capacitación: SI | Investigación: SI | Extensión: SI | Gestión: NO\nComentario: Participación activa en proyectos."
        responder_pregunta_texto(db, rset.id, ["actividades de capacitación", "3."], texto_actividades, preguntas_ac)

        # Seccion 4
        responder_pregunta_texto(db, rset.id, ["desempeño de los jtp", "4."], dato["auxiliar"], preguntas_ac)

        db.commit()
        informes_creados.append(aci)
        print(f"   + Informe COMPLETADO: {materia.nombre}")

    # 3. Informe Sintético
    print("   Generando Informe Sintético...")
    sintetico_viejo = db.query(InformeSinteticoInstancia).filter_by(
        departamento_id=depto.id, informe_sintetico_id=plantilla_sintetico.id
    ).first()
    if sintetico_viejo:
        db.delete(sintetico_viejo)
        db.commit()

    sintetico = InformeSinteticoInstancia(
        informe_sintetico_id=plantilla_sintetico.id,
        departamento_id=depto.id,
        tipo=TipoInstrumento.INFORME_SINTETICO,
        fecha_inicio=datetime.now(),
        fecha_fin=datetime.now(),
        estado=EstadoInforme.COMPLETADO, 
        integrantes_comision=INTEGRANTES_COMISION 
    )
    db.add(sintetico)
    db.commit()

    for aci in informes_creados:
        aci.informe_sintetico_instancia_id = sintetico.id
        aci.estado = EstadoInforme.RESUMIDO
        db.add(aci)
    
    rset_sint = RespuestaSet(instrumento_instancia_id=sintetico.id)
    db.add(rset_sint)
    db.commit()
    
    preguntas_sint = [p for s in plantilla_sintetico.secciones for p in s.preguntas]
    responder_pregunta_texto(db, rset_sint.id, ["comentarios que desee expresar"], OBSERVACIONES_FINALES, preguntas_sint)
    
    db.commit()

    print("\n✅ ¡Demo Puerto Madryn Full Lista!")
    
    # Comprobación final para imprimir qué usuario usar
    if admin_existente:
        print(f"   Usuario: {admin_existente.username} / 123456")
    else:
        print(f"   Usuario: admin_pm / 123456")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_demo_pm(db)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()