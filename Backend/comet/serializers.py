from rest_framework import serializers

from .models import CometExportLog


class CometExportLogSerializer(serializers.ModelSerializer):
    jugador_nombre = serializers.SerializerMethodField()
    usuario_nombre = serializers.CharField(source="usuario.get_username", read_only=True, default=None)

    class Meta:
        model = CometExportLog
        fields = [
            "log_id",
            "jugador",
            "jugador_nombre",
            "usuario",
            "usuario_nombre",
            "fecha",
            "exitoso",
            "mensaje",
            "respuesta",
        ]
        read_only_fields = fields

    def get_jugador_nombre(self, obj):
        persona = obj.jugador.socio.persona
        return f"{persona.apellido}, {persona.nombre}"


class ExportarJugadorResponseSerializer(serializers.Serializer):
    """Respuesta del POST /comet/exportar/jugador/<pk>/."""
    exitoso = serializers.BooleanField()
    mensaje = serializers.CharField()
    log_id = serializers.IntegerField()