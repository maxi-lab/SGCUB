from django.contrib import admin

from .models import CometExportLog


@admin.register(CometExportLog)
class CometExportLogAdmin(admin.ModelAdmin):
    list_display = ("log_id", "jugador", "usuario", "fecha", "exitoso", "mensaje")
    list_filter = ("exitoso", "fecha")
    search_fields = ("jugador__socio__persona__dni", "jugador__socio__persona__apellido")
    readonly_fields = ("fecha",)