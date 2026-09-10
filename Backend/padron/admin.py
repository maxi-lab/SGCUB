from django.contrib import admin

# Register your models here.
from .models import EstadoDeportivo, Persona, Socio, Categoria, Jugador, Docente, ContactoEmergencia, DocenteCategoria
admin.site.register(Persona)
admin.site.register(Socio)
admin.site.register(Categoria)
admin.site.register(Jugador)
admin.site.register(EstadoDeportivo)
admin.site.register(Docente)
admin.site.register(ContactoEmergencia)
admin.site.register(DocenteCategoria)