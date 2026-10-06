from rest_framework import serializers

from .models import EnvioNotificacion, Notificacion


class EnvioNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnvioNotificacion
        fields = [
            "id",
            "notificacion",
            "destinatario_contacto",
            "canal",
            "estado",
            "detalle_fallo",
            "fecha_envio",
        ]
        read_only_fields = ["id", "fecha_envio"]


class NotificacionSerializer(serializers.ModelSerializer):
    envios = EnvioNotificacionSerializer(many=True, read_only=True)

    class Meta:
        model = Notificacion
        fields = ["id", "titulo", "asunto", "contenido", "estado", "fecha_creacion", "envios"]
        read_only_fields = ["id", "fecha_creacion", "envios"]
