from datetime import date

from django.core.exceptions import ValidationError
from django.db import models


def get_anio_actual():
    return date.today().year


class Persona(models.Model):
    persona_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default="")
    apellido = models.CharField(max_length=50, default="")
    dni = models.CharField(max_length=20, unique=True, default="")
    telefono = models.CharField(max_length=20, default="")
    email = models.EmailField(max_length=100, unique=True, blank=True, null=True,)

    class Meta:
        db_table = "persona"

    def __str__(self):
        return f"{self.nombre} {self.apellido}"


class Socio(models.Model):
    socio_id = models.AutoField(primary_key=True)
    persona = models.OneToOneField(
        Persona,
        on_delete=models.CASCADE,
        related_name="socio"
    )

    class Meta:
        db_table = "socio"

    def __str__(self):
        return f"{self.persona.nombre} {self.persona.apellido}"


class Categoria(models.Model):
    GENERO_MASCULINO = "M"
    GENERO_FEMENINO = "F"
    GENERO_CHOICES = [
        (GENERO_MASCULINO, "Masculino"),
        (GENERO_FEMENINO, "Femenino"),
    ]

    categoria_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    anio_vigente = models.PositiveIntegerField(default=get_anio_actual)
    edad_minima = models.PositiveSmallIntegerField(default=0)
    edad_maxima = models.PositiveSmallIntegerField(default=0)
    genero = models.CharField(
        max_length=1,
        choices=GENERO_CHOICES,
        blank=True,
        default="",
    )

    class Meta:
        db_table = "categoria"
        constraints = [
            models.UniqueConstraint(
                fields=["nombre", "anio_vigente", "genero"],
                name="categoria_nombre_anio_genero_unico",
            ),
            models.CheckConstraint(
                check=models.Q(edad_maxima__gte=models.F("edad_minima")),
                name="categoria_edad_maxima_gte_minima",
            ),
        ]

    def clean(self):
        if self.edad_maxima < self.edad_minima:
            raise ValidationError(
                {"edad_maxima": "La edad máxima no puede ser menor que la edad mínima."}
            )

    def __str__(self):
        return f"{self.nombre} ({self.anio_vigente})"


def get_default_categoria():
    categoria = Categoria.objects.filter(nombre="No asignado").only("pk").first()
    if categoria is None:
        categoria = Categoria.objects.create(nombre="No asignado")
    return categoria.pk



class EstadoDeportivo(models.Model):
    estado_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)

    class Meta:
        db_table = "estado_deportivo"

    def __str__(self):
        return self.nombre


def get_default_estado_deportivo():
    estado, _ = EstadoDeportivo.objects.get_or_create(nombre="Activo")
    return estado.pk


class Jugador(models.Model):
    jugador_id = models.AutoField(primary_key=True)
    obra_social = models.CharField(max_length=50, default="", blank=True)
    tallaIndumentaria = models.CharField(max_length=50, default="", blank=True)
    socio = models.OneToOneField(
        Socio,
        on_delete=models.CASCADE,
        related_name="jugador"
    )

    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name="jugadores",
        null=False,
        blank=False,
        default=get_default_categoria,
    )

    estado = models.ForeignKey(
        EstadoDeportivo,
        on_delete=models.PROTECT,
        related_name="jugadores",
        null=False,
        blank=False,
        default=get_default_estado_deportivo,
    )

    class Meta:
        db_table = "jugador"
        verbose_name = "Jugador"
        verbose_name_plural = "Jugadores"

    def __str__(self):
        return f"{self.socio.persona.nombre} {self.socio.persona.apellido} - Socio ID: {self.socio.socio_id}"

class Docente(models.Model):
    docente_id = models.AutoField(primary_key=True)
    persona = models.OneToOneField(
        Persona,
        on_delete=models.CASCADE,
        related_name="docente"
    )
    legajo = models.IntegerField()

    class Meta:
        db_table = "docente"

    def __str__(self):
        return f"Docente {self.legajo}"

class ContactoEmergencia(models.Model):
    contacto_emergencia_id = models.AutoField(primary_key=True)

    persona = models.ForeignKey(
        Persona,
        on_delete=models.CASCADE,
        related_name="contactos_emergencia",
    )

    jugador = models.ForeignKey(
        Jugador,
        on_delete=models.CASCADE,
        related_name="contactos_emergencia",
    )

    responsable_legal = models.BooleanField(default=False)
    relacion = models.CharField(max_length=50)

    class Meta:
        db_table = "contacto_emergencia"
        constraints = [
            models.UniqueConstraint(
                fields=["persona", "jugador"],
                name="persona_jugador_contacto_unico",
            )
        ]

