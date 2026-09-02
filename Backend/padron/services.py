from .models import Categoria, Jugador
from datetime import date
def recategorizar_jugadores():
    jugadores = Jugador.objects.all()
    for jugador in jugadores:
        recategorizar_jugador(jugador)
def recategorizar_jugador(jugador):
    anio_nacimiento = jugador.socio.persona.fecha_nacimiento.year
    categoria_actual = jugador.categoria
    print(f"Recategorizando jugador {jugador} de categoria {categoria_actual} con anio de nacimiento {anio_nacimiento}")
    if categoria_actual.anio_vigente != anio_nacimiento:
        jugador.categoria = Categoria.objects.filter(anio_vigente=anio_nacimiento).first()
        jugador.save()
        print(f"Recategorizando jugador {jugador}  pasado a categoria {jugador.categoria}")
