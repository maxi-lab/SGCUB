from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from padron.models import Jugador

from .models import CometExportLog
from .serializers import CometExportLogSerializer
from .service import exportar_jugador, exportar_lote


@extend_schema(
    tags=["Comet / Exportación"],
    responses=CometExportLogSerializer,
)
@api_view(["POST"])
def exportar_jugador_view(request, pk):
    jugador = get_object_or_404(
        Jugador.objects.select_related(
            "socio__persona__genero", "categoria", "estado",
        ),
        pk=pk,
    )
    usuario = request.user if request.user.is_authenticated else None
    log = exportar_jugador(jugador, usuario=usuario)
    return Response(
        CometExportLogSerializer(log).data,
        status=status.HTTP_201_CREATED if log.exitoso else status.HTTP_400_BAD_REQUEST,
    )


@extend_schema(tags=["Comet / Exportación"])
@api_view(["POST"])
def exportar_lote_view(request):
    ids = request.data.get("jugador_ids") or []
    if not isinstance(ids, list) or not ids:
        return Response(
            {"detail": "Enviá una lista no vacía en `jugador_ids`."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    jugadores = list(
        Jugador.objects.filter(pk__in=ids).select_related(
            "socio__persona__genero", "categoria", "estado",
        )
    )
    if len(jugadores) != len(set(ids)):
        return Response(
            {"detail": "Uno o más jugadores no existen."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usuario = request.user if request.user.is_authenticated else None
    return Response(exportar_lote(jugadores, usuario=usuario))


@extend_schema(tags=["Comet / Exportación"], responses=CometExportLogSerializer(many=True))
@api_view(["GET"])
def log_exportaciones_view(request):
    logs = CometExportLog.objects.select_related(
        "jugador__socio__persona", "usuario",
    )
    jugador_id = request.query_params.get("jugador_id")
    if jugador_id and jugador_id.isdigit():
        logs = logs.filter(jugador_id=int(jugador_id))
    return Response(CometExportLogSerializer(logs, many=True).data)


@extend_schema(tags=["Comet / Estado"])
@api_view(["GET"])
def estado_jugador_view(request, pk):
    """Consulta el estado del último intento de exportación de un jugador."""
    jugador = get_object_or_404(Jugador, pk=pk)
    ultimo = jugador.comet_exports.first()
    return Response({
        "jugador_id": jugador.pk,
        "exportado": bool(ultimo and ultimo.exitoso),
        "ultimo_intento": CometExportLogSerializer(ultimo).data if ultimo else None,
    })