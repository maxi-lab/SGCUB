from django.urls import path

from .views import (
    estado_jugador_view,
    exportar_jugador_view,
    jugadores_view,
    log_operaciones_view,
)

urlpatterns = [
    path("jugadores/", jugadores_view, name="comet-jugadores"),
    path("jugador/<int:pk>/exportar/", exportar_jugador_view, name="comet-exportar-jugador"),
    path("jugador/<int:pk>/estado/", estado_jugador_view, name="comet-estado-jugador"),
    path("logs/", log_operaciones_view, name="comet-logs"),
]