from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import CanalNotificacion, EnvioNotificacion, EstadoNotificacion, Notificacion
from .serializers import EnvioNotificacionSerializer, NotificacionSerializer


@extend_schema(tags=["Comunicaciones / Opciones"])
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
    tags=["Comunicaciones / Notificaciones"],
    request=NotificacionSerializer,
    responses=NotificacionSerializer,
)
@api_view(["GET", "POST"])
def notificacion_list_create(request):
    if request.method == "GET":
        notificaciones = Notificacion.objects.all().order_by("-fecha_creacion")
        serializer = NotificacionSerializer(notificaciones, many=True)
        return Response(serializer.data)

    serializer = NotificacionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=["Comunicaciones / Notificaciones"],
    request=NotificacionSerializer,
    responses=NotificacionSerializer,
)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def notificacion_detail(request, pk):
    notificacion = get_object_or_404(Notificacion, pk=pk)

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
    tags=["Comunicaciones / Envíos"],
    request=EnvioNotificacionSerializer,
    responses=EnvioNotificacionSerializer,
    examples=[
        OpenApiExample(
            "Envio de notificación",
            value={
                "notificacion": 1,
                "destinatario_contacto": "+5491123456789",
                "canal": "WHATSAPP",
                "estado": "PROGRAMADA",
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
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=["Comunicaciones / Envíos"],
    request=EnvioNotificacionSerializer,
    responses=EnvioNotificacionSerializer,
    examples=[
        OpenApiExample(
            "Actualizar envio",
            value={
                "destinatario_contacto": "+5491198765432",
                "canal": "MAIL",
                "estado": "ENVIADA",
                "detalle_fallo": "",
            },
            request_only=True,
        )
    ],
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
