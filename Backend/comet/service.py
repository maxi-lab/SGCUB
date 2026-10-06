import logging

from .client import get_comet_client
from .eligibility import tiene_apto_fisico_vigente
from .exceptions import CometError
from .models import CometExportLog
from .transformer import jugador_a_comet

logger = logging.getLogger(__name__)


def exportar_jugador(jugador, usuario=None) -> CometExportLog:
    """
    Exporta un jugador a COMET y registra el resultado en `CometExportLog`.
    Siempre devuelve un log, exitoso o no, para auditoría.
    """
    puede, motivo = tiene_apto_fisico_vigente(jugador)
    if not puede:
        return CometExportLog.objects.create(
            jugador=jugador,
            usuario=usuario,
            exitoso=False,
            mensaje=motivo,
        )

    dto = jugador_a_comet(jugador)

    try:
        client = get_comet_client()
        respuesta = client.crear_jugador(dto.to_payload())
    except CometError as exc:
        logger.exception("Error al exportar jugador %s a COMET", jugador.pk)
        return CometExportLog.objects.create(
            jugador=jugador,
            usuario=usuario,
            exitoso=False,
            mensaje=str(exc),
        )

    return CometExportLog.objects.create(
        jugador=jugador,
        usuario=usuario,
        exitoso=True,
        mensaje="Exportación exitosa.",
        respuesta=respuesta,
    )


def exportar_lote(jugadores, usuario=None) -> dict:
    """Exporta varios jugadores. Devuelve un resumen agregado."""
    creados = []
    rechazados = []
    for jugador in jugadores:
        log = exportar_jugador(jugador, usuario)
        (creados if log.exitoso else rechazados).append(log)

    return {
        "total": len(jugadores),
        "exitosos": len(creados),
        "rechazados": len(rechazados),
        "logs": [log.log_id for log in creados + rechazados],
    }