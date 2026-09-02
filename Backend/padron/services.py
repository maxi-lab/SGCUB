from .models import Categoria, Jugador
from datetime import date
def recategorizar_jugadores():
    jugadores = Jugador.objects.all()
    for jugador in jugadores:
        recategorizar_jugador(jugador)
def recategorizar_jugador(jugador):
    edad = obtener_edad(jugador)
    if edad is None:
        return
    categoria = get_categoria_por_edad(edad)
    if categoria is not None and jugador.categoria != categoria:
        jugador.categoria = categoria
        
        jugador.save()
def get_categoria_por_edad(edad):
    categorias = Categoria.objects.all()
    for categoria in categorias:    
        if categoria.edad_minima <= edad <= categoria.edad_maxima:
            return categoria
    return None
def obtener_edad(jugador):
    fecha_nacimiento = jugador.socio.persona.fecha_nacimiento
    if fecha_nacimiento is None:
        return None
    hoy = date.today()
    edad = hoy.year - fecha_nacimiento.year - ((hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day))
    return edad