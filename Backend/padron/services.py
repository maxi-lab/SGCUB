from .models import Categoria, Jugador
from datetime import date

GENERO_PERSONA_A_CATEGORIA = {
    "Masculino": Categoria.GENERO_MASCULINO,  # "M"
    "Femenino": Categoria.GENERO_FEMENINO,    # "F"
}


def recategorizar_jugadores():
    jugadores = Jugador.objects.all()
    for jugador in jugadores:
        recategorizar_jugador(jugador)


def recategorizar_jugador(jugador):
    anio_nacimiento = jugador.socio.persona.fecha_nacimiento.year
    categoria_actual = jugador.categoria

    genero_obj = jugador.socio.persona.genero
    genero_nombre = genero_obj.nombre if genero_obj else None
    genero_categoria = GENERO_PERSONA_A_CATEGORIA.get(genero_nombre, None)

    if categoria_actual.anio_vigente != anio_nacimiento or categoria_actual.genero != genero_categoria:
        if genero_categoria is None:
            
            return

        nueva_categoria = Categoria.objects.filter(
            anio_vigente=anio_nacimiento, genero=genero_categoria
        ).first()

        if nueva_categoria is None:
            return

        jugador.categoria = nueva_categoria
        jugador.save()
        print(f"Recategorizando jugador {jugador} pasado a categoria {jugador.categoria} {jugador.categoria.genero}")