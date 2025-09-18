from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models import ModeloBase

if TYPE_CHECKING:
    from src.encuestas.models import Encuesta


class Pregunta(ModeloBase):
    __tablename__ = "pregunta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    seccion: Mapped[int] = mapped_column(Integer, nullable=False)
    descripcion: Mapped[str] = mapped_column(String, nullable=False)

    encuesta_id: Mapped[int] = mapped_column(ForeignKey("encuesta.id"), nullable=False)
    encuesta: Mapped["Encuesta"] = relationship(back_populates="preguntas")
    # en SQLalchemy se representa la relacion de uno a muchos (una encuesta muchas preguntas)
    # dejando la clave foranea en el lado de "muchos" (la pregunta) y un relationship en ambos
    # modelos para navegar la asociacion.
