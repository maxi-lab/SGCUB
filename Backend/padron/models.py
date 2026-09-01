from django.db import models
import django.utils.timezone


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


class EstadoSocio(models.Model):
    estado_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)

    class Meta:
        db_table = "estado_socio"

    def __str__(self):
        return self.nombre


def get_default_estado_socio():
    estado, _ = EstadoSocio.objects.get_or_create(nombre="Activo")
    return estado.pk


class Socio(models.Model):
    socio_id = models.AutoField(primary_key=True)
    persona = models.OneToOneField(
        Persona,
        on_delete=models.CASCADE,
        related_name="socio"
    )
    estado_socio = models.ForeignKey(
        EstadoSocio,
        on_delete=models.PROTECT,
        related_name="socios",
        null=False,
        blank=False,
        default=get_default_estado_socio,
    )
    fecha_alta = models.DateField(default=django.utils.timezone.localdate)
    numero_socio = models.PositiveIntegerField(unique=True, null=True, blank=True)

    class Meta:
        db_table = "socio"

    def save(self, *args, **kwargs):
        if not self.numero_socio:
            last_socio = Socio.objects.filter(numero_socio__isnull=False).order_by('-numero_socio').first()
            if last_socio and last_socio.numero_socio:
                self.numero_socio = last_socio.numero_socio + 1
            else:
                self.numero_socio = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.persona.nombre} {self.persona.apellido}"


class Categoria(models.Model):
    categoria_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)

    class Meta:
        db_table = "categoria"

    def __str__(self):
        return self.nombre


def get_default_categoria():
    categoria, _ = Categoria.objects.get_or_create(nombre="No asignado")
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

