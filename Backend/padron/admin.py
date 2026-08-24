from django.contrib import admin

# Register your models here.
from .models import EstadoDeportivo, Persona, Socio, Categoria, Jugador
admin.site.register(Persona)
admin.site.register(Socio)
admin.site.register(Categoria)
admin.site.register(Jugador)
admin.site.register(EstadoDeportivo)
