from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import CanalNotificacion, EnvioNotificacion, EstadoNotificacion, Notificacion
from .serializers import EnvioNotificacionSerializer, NotificacionSerializer


@extend_schema(
    tags=["Comunicaciones / Opciones"],
    summary="Listar opciones de comunicación",
    description="Devuelve las opciones disponibles de canales (WhatsApp, Email) y estados (Programada, Enviada, Fallida).",
    responses={
        200: {
            "type": "object",
            "properties": {
                "canales": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string"},
                            "label": {"type": "string"},
                        },
                    },
                },
                "estados": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string"},
                            "label": {"type": "string"},
                        },
                    },
                },
            },
        }
    },
)
@api_view(["GET"])
def opciones_comunicacion(request):
    return Response(
        {
            "canales": [
                {"value": value, "label": label}
                for value, label in CanalNotificacion.choices
            ],
            "estados": [
                {"value": value, "label": label}
                for value, label in EstadoNotificacion.choices
            ],
        }
    )


@extend_schema(
    methods=["GET"],
    tags=["Comunicaciones / Notificaciones"],
    operation_id="comunicaciones_notificacion_list",
    summary="Listar notificaciones",
    description="Devuelve el listado de todas las notificaciones institucionales ordenadas por fecha de creación descendente.",
    responses=NotificacionSerializer(many=True),
)
@extend_schema(
    methods=["POST"],
    tags=["Comunicaciones / Notificaciones"],
    operation_id="comunicaciones_notificacion_create",
    summary="Crear y persistir notificación",
    description="Crea y persiste una nueva notificación institucional en la base de datos.",
    request=NotificacionSerializer,
    responses={201: NotificacionSerializer},
)
@api_view(["GET", "POST"])
def notificacion_list_create(request):
    if request.method == "GET":
        notificaciones = Notificacion.objects.prefetch_related("envios").all().order_by("-fecha_creacion")
        serializer = NotificacionSerializer(notificaciones, many=True)
        return Response(serializer.data)

    serializer = NotificacionSerializer(data=request.data)
    if serializer.is_valid():
        notificacion = serializer.save()

        # Si el payload incluye envíos individuales o masivos, persistirlos en EnvioNotificacion
        envios_data = request.data.get("envios", [])
        if isinstance(envios_data, list) and envios_data:
            envios_to_create = []
            for item in envios_data:
                contacto = item.get("destinatario_contacto")
                canal = item.get("canal", CanalNotificacion.WHATSAPP)
                if contacto:
                    envios_to_create.append(
                        EnvioNotificacion(
                            notificacion=notificacion,
                            destinatario_contacto=contacto,
                            canal=canal,
                            estado=item.get("estado", EstadoNotificacion.ENVIADA),
                        )
                    )
            if envios_to_create:
                EnvioNotificacion.objects.bulk_create(envios_to_create)

        # Despachar correos vía Brevo SMTP
        try:
            from django_q.tasks import async_task
            async_task("comunicaciones.services.despachar_envios_email_notificacion", notificacion.id)
        except Exception:
            try:
                from .services import despachar_envios_email_notificacion
                despachar_envios_email_notificacion(notificacion.id)
            except Exception:
                pass

        return Response(NotificacionSerializer(notificacion).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    methods=["GET"],
    tags=["Comunicaciones / Notificaciones"],
    operation_id="comunicaciones_notificacion_retrieve",
    summary="Obtener notificación por ID",
    description="Devuelve el detalle de una notificación junto con sus envíos asociados.",
    responses=NotificacionSerializer,
)
@extend_schema(
    methods=["PUT"],
    tags=["Comunicaciones / Notificaciones"],
    operation_id="comunicaciones_notificacion_update",
    summary="Actualizar notificación completa",
    description="Actualiza todos los campos de una notificación existente.",
    request=NotificacionSerializer,
    responses=NotificacionSerializer,
)
@extend_schema(
    methods=["PATCH"],
    tags=["Comunicaciones / Notificaciones"],
    operation_id="comunicaciones_notificacion_partial_update",
    summary="Actualizar notificación parcialmente",
    description="Actualiza uno o varios campos de una notificación existente.",
    request=NotificacionSerializer,
    responses=NotificacionSerializer,
)
@extend_schema(
    methods=["DELETE"],
    tags=["Comunicaciones / Notificaciones"],
    operation_id="comunicaciones_notificacion_destroy",
    summary="Eliminar notificación",
    description="Elimina la notificación especificada.",
    responses={204: None},
)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def notificacion_detail(request, pk):
    notificacion = get_object_or_404(Notificacion.objects.prefetch_related("envios"), pk=pk)

    if request.method == "GET":
        serializer = NotificacionSerializer(notificacion)
        return Response(serializer.data)

    if request.method in ["PUT", "PATCH"]:
        serializer = NotificacionSerializer(notificacion, data=request.data, partial=request.method == "PATCH")
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    notificacion.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    methods=["GET"],
    tags=["Comunicaciones / Envíos"],
    operation_id="comunicaciones_envio_notificacion_list",
    summary="Listar envíos de notificaciones",
    description="Devuelve el historial de envíos individuales de notificaciones ordenados por fecha de envío descendente.",
    responses=EnvioNotificacionSerializer(many=True),
)
@extend_schema(
    methods=["POST"],
    tags=["Comunicaciones / Envíos"],
    operation_id="comunicaciones_envio_notificacion_create",
    summary="Registrar envío de notificación",
    description="Registra un envío individual asociado a una notificación en la base de datos.",
    request=EnvioNotificacionSerializer,
    responses={201: EnvioNotificacionSerializer},
    examples=[
        OpenApiExample(
            "Envio de notificación",
            value={
                "notificacion": 1,
                "destinatario_contacto": "+5491123456789",
                "canal": "WHATSAPP",
                "estado": "ENVIADA",
                "detalle_fallo": "",
            },
            request_only=True,
        )
    ],
)
@api_view(["GET", "POST"])
def envio_notificacion_list_create(request):
    if request.method == "GET":
        envios = EnvioNotificacion.objects.select_related("notificacion").all().order_by("-fecha_envio")
        serializer = EnvioNotificacionSerializer(envios, many=True)
        return Response(serializer.data)

    serializer = EnvioNotificacionSerializer(data=request.data)
    if serializer.is_valid():
        envio = serializer.save()
        if envio.canal == CanalNotificacion.MAIL and "@" in envio.destinatario_contacto:
            try:
                from .services import enviar_email_individual
                notif = envio.notificacion
                enviar_email_individual(
                    destinatario=envio.destinatario_contacto,
                    asunto=notif.asunto or notif.titulo,
                    contenido=notif.contenido,
                    envio_id=envio.id,
                )
            except Exception:
                pass
        return Response(EnvioNotificacionSerializer(envio).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    methods=["GET"],
    tags=["Comunicaciones / Envíos"],
    operation_id="comunicaciones_envio_notificacion_retrieve",
    summary="Obtener detalle de envío",
    description="Devuelve la información de un envío de notificación por su ID.",
    responses=EnvioNotificacionSerializer,
)
@extend_schema(
    methods=["PUT"],
    tags=["Comunicaciones / Envíos"],
    operation_id="comunicaciones_envio_notificacion_update",
    summary="Actualizar envío completo",
    description="Actualiza todos los campos de un envío existente.",
    request=EnvioNotificacionSerializer,
    responses=EnvioNotificacionSerializer,
    examples=[
        OpenApiExample(
            "Actualizar envio",
            value={
                "notificacion": 1,
                "destinatario_contacto": "+5491198765432",
                "canal": "MAIL",
                "estado": "ENVIADA",
                "detalle_fallo": "",
            },
            request_only=True,
        )
    ],
)
@extend_schema(
    methods=["PATCH"],
    tags=["Comunicaciones / Envíos"],
    operation_id="comunicaciones_envio_notificacion_partial_update",
    summary="Actualizar envío parcialmente",
    description="Actualiza uno o varios campos de un envío existente.",
    request=EnvioNotificacionSerializer,
    responses=EnvioNotificacionSerializer,
)
@extend_schema(
    methods=["DELETE"],
    tags=["Comunicaciones / Envíos"],
    operation_id="comunicaciones_envio_notificacion_destroy",
    summary="Eliminar envío",
    description="Elimina el registro de un envío de notificación.",
    responses={204: None},
)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def envio_notificacion_detail(request, pk):
    envio = get_object_or_404(EnvioNotificacion, pk=pk)

    if request.method == "GET":
        serializer = EnvioNotificacionSerializer(envio)
        return Response(serializer.data)

    if request.method in ["PUT", "PATCH"]:
        serializer = EnvioNotificacionSerializer(envio, data=request.data, partial=request.method == "PATCH")
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    envio.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
