from dataclasses import asdict, dataclass
from typing import Optional


@dataclass
class CometPlayerDTO:
    """
    Representación de un jugador en el formato que espera COMET.

    IMPORTANTE: los nombres de los campos son tentativos. Cuando llegue
    la especificación real, ajustar en este archivo y en `transformer.py`.
    El resto del sistema no debería necesitar cambios.
    """

    # --- Identificación ---
    documento: str                                    # TODO spec: ¿"documento", "dni", "nroDoc"?
    tipo_documento: str = "DNI"                       # TODO spec: verificar catálogo

    # --- Datos personales ---
    nombres: str = ""                                 # TODO spec
    apellidos: str = ""                               # TODO spec
    fecha_nacimiento: str = ""                        # ISO YYYY-MM-DD, TODO spec: formato
    genero: str = ""                                  # "M"/"F", TODO spec

    # --- Club ---
    numero_socio: Optional[int] = None                # TODO spec: ¿lo pide COMET?
    categoria: str = ""                               # TODO spec
    numero_camiseta: Optional[int] = None             # TODO spec

    # --- Documentación ---
    apto_fisico_vigente: bool = False
    apto_fisico_vencimiento: Optional[str] = None     # ISO YYYY-MM-DD

    def to_payload(self) -> dict:
        """Diccionario listo para serializar como JSON."""
        return {k: v for k, v in asdict(self).items() if v not in (None, "")}