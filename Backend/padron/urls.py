from django.urls import path

from .views import (
    categoria_detail,
    categoria_list_create,
    docente_detail,
    docente_list_create,
    estado_detail,
    estado_list_create,
    jugador_detail,
    jugador_list_create,
    persona_detail,
    persona_list_create,
    socio_detail,
    socio_list_create,
    contacto_emergencia_list_create,
    contacto_emergencia_detail,
)

urlpatterns = [
    path("persona/", persona_list_create, name="persona_list_create"),
    path("persona/<int:pk>/", persona_detail, name="persona_detail"),
    path("socio/", socio_list_create, name="socio_list_create"),
    path("socio/<int:pk>/", socio_detail, name="socio_detail"),
    path("categoria/", categoria_list_create, name="categoria_list_create"),
    path("categoria/<int:pk>/", categoria_detail, name="categoria_detail"),
    path("estado/", estado_list_create, name="estado_list_create"),
    path("estado/<int:pk>/", estado_detail, name="estado_detail"),
    path("jugador/", jugador_list_create, name="jugador_list_create"),
    path("jugador/<int:pk>/", jugador_detail, name="jugador_detail"),
    path("docente/", docente_list_create, name="docente_list_create"),
    path("docente/<int:pk>/", docente_detail, name="docente_detail"),
    path("contacto-emergencia/", contacto_emergencia_list_create, name="contacto_emergencia_list_create"),
    path("contacto-emergencia/<int:pk>/", contacto_emergencia_detail, name="contacto_emergencia_detail"),
]
