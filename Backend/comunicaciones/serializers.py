from rest_framework import serializers

from .models import EnvioNotificacion, Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = ["id", "titulo", "asunto", "contenido", "estado", "fecha_creacion"]
        read_only_fields = ["id", "fecha_creacion"]


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
        read_only_fields = ["id", "notificacion", "fecha_envio"]
