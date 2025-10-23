from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from src.enumerados import TipoPreguntaEnum
from src.estadisticas import schemas
from src.preguntas.models import Opcion, Pregunta
from src.respuestas.models import Respuesta
from src.secciones.models import Seccion


def obtener_resumen(
    db: Session, encuesta_id: Optional[int] = None
) -> schemas.ResumenEstadisticas:
    secciones: Dict[int, Dict] = {}

    condiciones_opciones = [Pregunta.tipo == TipoPreguntaEnum.MULTIPLE_CHOICE]
    if encuesta_id is not None:
        condiciones_opciones.append(Seccion.encuesta_id == encuesta_id)

    stmt_opciones = (
        select(
            Seccion.id.label("seccion_id"),
            Seccion.nombre.label("seccion_nombre"),
            Opcion.texto.label("opcion_texto"),
            func.count(Respuesta.id).label("total_respuestas"),
        )
        .join(Pregunta, Pregunta.seccion_id == Seccion.id)
        .join(Opcion, Opcion.pregunta_id == Pregunta.id)
        .outerjoin(
            Respuesta,
            and_(
                Respuesta.pregunta_id == Pregunta.id,
                Respuesta.opcion_id == Opcion.id,
            ),
        )
        .where(*condiciones_opciones)
        .group_by(Seccion.id, Seccion.nombre, Opcion.texto)
        .order_by(Seccion.id, Opcion.texto)
    )

    for row in db.execute(stmt_opciones):
        seccion_id = row.seccion_id
        seccion_nombre = row.seccion_nombre
        opcion_texto = (row.opcion_texto or "Sin respuesta").strip()
        total = int(row.total_respuestas or 0)

        entry = secciones.setdefault(
            seccion_id,
            {
                "id": seccion_id,
                "nombre": seccion_nombre,
                "opciones": defaultdict(int),
                "total_opciones": 0,
                "abiertas": [],
                "total_abiertas": 0,
            },
        )

        entry["opciones"][opcion_texto] += total
        entry["total_opciones"] += total

    condiciones_abiertas = [Pregunta.tipo == TipoPreguntaEnum.REDACCION]
    if encuesta_id is not None:
        condiciones_abiertas.append(Seccion.encuesta_id == encuesta_id)

    stmt_abiertas = (
        select(
            Seccion.id.label("seccion_id"),
            Seccion.nombre.label("seccion_nombre"),
            Pregunta.id.label("pregunta_id"),
            Pregunta.texto.label("pregunta_texto"),
            func.count(Respuesta.id).label("total_respuestas"),
        )
        .join(Pregunta, Pregunta.seccion_id == Seccion.id)
        .outerjoin(Respuesta, Respuesta.pregunta_id == Pregunta.id)
        .where(*condiciones_abiertas)
        .group_by(Seccion.id, Seccion.nombre, Pregunta.id, Pregunta.texto)
        .order_by(Seccion.id, Pregunta.id)
    )

    preguntas_abiertas_ids: List[int] = []
    for row in db.execute(stmt_abiertas):
        seccion_id = row.seccion_id
        seccion_nombre = row.seccion_nombre
        pregunta_id = row.pregunta_id
        pregunta_texto = row.pregunta_texto
        total = int(row.total_respuestas or 0)

        entry = secciones.setdefault(
            seccion_id,
            {
                "id": seccion_id,
                "nombre": seccion_nombre,
                "opciones": defaultdict(int),
                "total_opciones": 0,
                "abiertas": [],
                "total_abiertas": 0,
            },
        )

        entry["abiertas"].append(
            {
                "pregunta_id": pregunta_id,
                "texto": pregunta_texto,
                "total": total,
                "ejemplos": [],
            }
        )
        entry["total_abiertas"] += total
        preguntas_abiertas_ids.append(pregunta_id)

    ejemplos_map: Dict[int, List[str]] = {}
    if preguntas_abiertas_ids:
        stmt_ejemplos = (
            select(Respuesta.pregunta_id, Respuesta.texto)
            .where(
                Respuesta.pregunta_id.in_(preguntas_abiertas_ids),
                Respuesta.opcion_id.is_(None),
                Respuesta.texto.is_not(None),
            )
            .order_by(Respuesta.created_at.desc(), Respuesta.id.desc())
        )

        for pregunta_id, texto in db.execute(stmt_ejemplos):
            if texto is None:
                continue
            ejemplos = ejemplos_map.setdefault(pregunta_id, [])
            if len(ejemplos) < 3:
                ejemplos.append(texto)

    option_totals: Dict[str, int] = defaultdict(int)
    secciones_resultado: List[schemas.SeccionStats] = []

    for seccion_id in sorted(secciones.keys()):
        datos = secciones[seccion_id]
        total_opciones = int(datos["total_opciones"])
        total_abiertas = int(datos["total_abiertas"])

        opciones = []
        for texto_opcion, total in sorted(datos["opciones"].items()):
            porcentaje = (
                0.0 if total_opciones == 0 else (total / total_opciones) * 100
            )
            opciones.append(
                schemas.OpcionStats(
                    texto=texto_opcion,
                    total=int(total),
                    porcentaje=porcentaje,
                )
            )
            option_totals[texto_opcion] += int(total)

        preguntas_abiertas = []
        for item in datos["abiertas"]:
            preguntas_abiertas.append(
                schemas.PreguntaAbiertaStats(
                    pregunta_id=item["pregunta_id"],
                    texto=item["texto"],
                    total_respuestas=int(item["total"]),
                    ejemplos=ejemplos_map.get(item["pregunta_id"], []),
                )
            )

        secciones_resultado.append(
            schemas.SeccionStats(
                id=datos["id"],
                nombre=datos["nombre"],
                total_respuestas=total_opciones + total_abiertas,
                total_respuestas_opciones=total_opciones,
                total_respuestas_abiertas=total_abiertas,
                opciones=opciones,
                preguntas_abiertas=preguntas_abiertas,
            )
        )

    total_respuestas_opciones = sum(option_totals.values())
    opciones_totales = []
    for texto, total in sorted(
        option_totals.items(), key=lambda item: item[1], reverse=True
    ):
        porcentaje = (
            0.0
            if total_respuestas_opciones == 0
            else (total / total_respuestas_opciones) * 100
        )
        opciones_totales.append(
            schemas.OpcionTotalStats(
                texto=texto,
                total=int(total),
                porcentaje=porcentaje,
            )
        )

    stmt_total_respuestas = (
        select(func.count(Respuesta.id))
        .select_from(Respuesta)
        .join(Pregunta, Respuesta.pregunta_id == Pregunta.id)
        .join(Seccion, Pregunta.seccion_id == Seccion.id)
    )
    if encuesta_id is not None:
        stmt_total_respuestas = stmt_total_respuestas.where(
            Seccion.encuesta_id == encuesta_id
        )
    total_respuestas = db.scalar(stmt_total_respuestas) or 0

    return schemas.ResumenEstadisticas(
        total_respuestas=int(total_respuestas),
        total_respuestas_opciones=total_respuestas_opciones,
        opciones_totales=opciones_totales,
        secciones=secciones_resultado,
    )
