from django.urls import path

from .views import (
    estado_jugador_view,
    exportar_jugador_view,
    exportar_lote_view,
    log_exportaciones_view,
)

urlpatterns = [
    path("exportar/jugador/<int:pk>/", exportar_jugador_view, name="comet-exportar-jugador"),
    path("exportar/lote/", exportar_lote_view, name="comet-exportar-lote"),
    path("jugador/<int:pk>/estado/", estado_jugador_view, name="comet-estado-jugador"),
    path("logs/", log_exportaciones_view, name="comet-logs"),
]