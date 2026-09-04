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
    if not jugador.socio.persona.fecha_nacimiento:
        return
        
    anio_nacimiento = jugador.socio.persona.fecha_nacimiento.year
    categoria_actual = jugador.categoria

    genero_obj = jugador.socio.persona.genero
    genero_nombre = genero_obj.nombre if genero_obj else None
    genero_categoria = GENERO_PERSONA_A_CATEGORIA.get(genero_nombre, None)

    if genero_categoria is None:
        return

    # Determinamos la edad del jugador en la temporada actual
    temporada_actual = categoria_actual.anio_vigente if categoria_actual else Categoria.objects.first().anio_vigente
    edad_competencia = temporada_actual - anio_nacimiento
    
    # ¿Está el jugador en una categoría incorrecta?
    # Es incorrecta si es de otro género, o si el jugador es DEMASIADO GRANDE para esa categoría.
    # Si el jugador es más chico (juega en una categoría más grande), ES VÁLIDO.
    es_invalida = (
        not categoria_actual or 
        categoria_actual.genero != genero_categoria or 
        edad_competencia > categoria_actual.edad_maxima
    )

    if es_invalida:
        # Buscamos la categoría natural a la que pertenece
        # IMPORTANTE: limitamos a edad_maxima <= 20 para NO auto-promover a Primera/Reserva
        nueva_categoria = Categoria.objects.filter(
            genero=genero_categoria,
            edad_maxima__gte=edad_competencia,
            edad_maxima__lte=20
        ).order_by('edad_maxima').first()

        if nueva_categoria != categoria_actual:
            if nueva_categoria:
                jugador.categoria = nueva_categoria
            else:
                from .models import get_default_categoria
                jugador.categoria_id = get_default_categoria()
                
            jugador.save()
            estado = nueva_categoria.nombre if nueva_categoria else "Desasignado (Pasó edad de Cuarta)"
            print(f"Recategorizando jugador {jugador} pasado a: {estado}")

def pasr_de_anio_vigente_a_categoria():
    categorias = Categoria.objects.all()
    for categoria in categorias:
        categoria.anio_vigente = categoria.anio_vigente + 1
        
        # Renombrar automáticamente las categorías Infantiles (solo las que son un año numérico)
        if categoria.nombre.isdigit() and len(categoria.nombre) == 4:
            categoria.nombre = str(categoria.anio_vigente - categoria.edad_maxima)
            
        categoria.save()

    # Después de cambiar el año y renombrar las categorías,
    # debemos recategorizar a todos los jugadores para que se ubiquen en sus nuevas categorías
    # correspondientes a su nueva edad.
    recategorizar_jugadores()