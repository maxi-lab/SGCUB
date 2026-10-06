from django.conf import settings
from django.db import models


class CometExportLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    jugador = models.ForeignKey(
        "padron.Jugador",
        on_delete=models.CASCADE,
        related_name="comet_exports",
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="comet_exports",
    )
    fecha = models.DateTimeField(auto_now_add=True)
    exitoso = models.BooleanField(default=False)
    mensaje = models.TextField(blank=True)
    respuesta = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "comet_export_log"
        ordering = ["-fecha"]
        verbose_name = "Log de exportación a COMET"
        verbose_name_plural = "Logs de exportación a COMET"

    def __str__(self):
        estado = "OK" if self.exitoso else "ERROR"
        return f"[{estado}] {self.jugador} - {self.fecha:%Y-%m-%d %H:%M}"