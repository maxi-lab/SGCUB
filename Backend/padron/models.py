from datetime import date

from django.db import IntegrityError, models, transaction
import django.utils.timezone


class Genero(models.Model):
    genero_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)

    class Meta:
        db_table = "genero"

    def __str__(self):
        return self.nombre


class Localidad(models.Model):
    localidad_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    codigo_postal = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = "localidad"

    def __str__(self):
        return self.nombre


class Domicilio(models.Model):
    domicilio_id = models.AutoField(primary_key=True)
    calle = models.CharField(max_length=100)
    numero = models.CharField(max_length=20)
    piso = models.CharField(max_length=20, blank=True, null=True)
    departamento = models.CharField(max_length=20, blank=True, null=True)
    entre_calle_1 = models.CharField(max_length=100, blank=True, null=True)
    entre_calle_2 = models.CharField(max_length=100, blank=True, null=True)
    barrio = models.CharField(max_length=100, blank=True, null=True)
    localidad = models.ForeignKey(Localidad, on_delete=models.PROTECT, related_name="domicilios")

    class Meta:
        db_table = "domicilio"

    def __str__(self):
        return f"{self.calle} {self.numero}, {self.localidad.nombre}"


def get_anio_actual():
    return date.today().year


def age_from(birth_date):
    if not birth_date:
        return None
    today = date.today()
    had_birthday = (today.month, today.day) >= (birth_date.month, birth_date.day)
    return today.year - birth_date.year - (0 if had_birthday else 1)


class Persona(models.Model):
    persona_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default="")
    apellido = models.CharField(max_length=50, default="")
    dni = models.CharField(max_length=20, unique=True, default="")
    telefono = models.CharField(max_length=20, default="")
    email = models.EmailField(max_length=100, blank=True, null=True,)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    genero = models.ForeignKey(Genero, on_delete=models.PROTECT, blank=True, null=True, related_name="personas")
    genero_otro = models.CharField(max_length=100, blank=True, null=True)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.SET_NULL, blank=True, null=True, related_name="personas")

    class Meta:
        db_table = "persona"

    @property
    def edad(self):
        return age_from(self.fecha_nacimiento)

    def __str__(self):
        return f"{self.nombre} {self.apellido}"


class EstadoSocio(models.Model):
    estado_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)

    class Meta:
        db_table = "estado_socio"

    def __str__(self):
        return self.nombre


ESTADO_SOCIO_ACTIVO = "Activo"
ESTADO_SOCIO_INACTIVO = "Inactivo"


def get_default_estado_socio():
    estado, _ = EstadoSocio.objects.get_or_create(nombre=ESTADO_SOCIO_ACTIVO)
    return estado.pk


class Socio(models.Model):
    socio_id = models.AutoField(primary_key=True)
    persona = models.OneToOneField(
        Persona,
        on_delete=models.PROTECT,
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

    NUMBER_ASSIGNMENT_ATTEMPTS = 5

    def save(self, *args, **kwargs):
        if self.numero_socio:
            return super().save(*args, **kwargs)
        for attempt in range(self.NUMBER_ASSIGNMENT_ATTEMPTS):
            last_number = Socio.objects.aggregate(max_number=models.Max("numero_socio"))["max_number"]
            self.numero_socio = (last_number or 0) + 1
            try:
                with transaction.atomic():
                    return super().save(*args, **kwargs)
            except IntegrityError:
                number_taken = Socio.objects.filter(numero_socio=self.numero_socio).exists()
                self.numero_socio = None
                if not number_taken or attempt == self.NUMBER_ASSIGNMENT_ATTEMPTS - 1:
                    raise

    def deactivate(self):
        """Baja lógica: el socio no se elimina, pasa a estado Inactivo."""
        self.estado_socio, _ = EstadoSocio.objects.get_or_create(nombre=ESTADO_SOCIO_INACTIVO)
        self.save(update_fields=["estado_socio"])

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
            )
        ]

    def competition_age(self, birth_date):
        """Edad que el jugador cumple en el año de la temporada (al 31/12 del anio_vigente)."""
        return self.anio_vigente - birth_date.year

    def accepts_age(self, birth_date):
        return self.competition_age(birth_date) <= self.edad_maxima

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


ESTADO_DEPORTIVO_ACTIVO = "Activo"
ESTADO_DEPORTIVO_INACTIVO = "Inactivo"
EDAD_MAYORIA = 18


def get_default_estado_deportivo():
    estado, _ = EstadoDeportivo.objects.get_or_create(nombre=ESTADO_DEPORTIVO_ACTIVO)
    return estado.pk


class Jugador(models.Model):
    jugador_id = models.AutoField(primary_key=True)
    obra_social = models.CharField(max_length=50, default="", blank=True)
    tallaIndumentaria = models.CharField(max_length=50, default="", blank=True)
    socio = models.OneToOneField(
        Socio,
        on_delete=models.PROTECT,
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

    categoria_secundaria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name="jugadores_secundarios",
        null=True,
        blank=True,
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

    def deactivate(self):
        """Baja lógica: el jugador no se elimina, pasa a estado deportivo Inactivo."""
        self.estado, _ = EstadoDeportivo.objects.get_or_create(nombre=ESTADO_DEPORTIVO_INACTIVO)
        self.save(update_fields=["estado"])

    def __str__(self):
        return f"{self.socio.persona.nombre} {self.socio.persona.apellido} - Socio ID: {self.socio.socio_id}"

class Docente(models.Model):
    docente_id = models.AutoField(primary_key=True)
    persona = models.OneToOneField(
        Persona,
        on_delete=models.PROTECT,
        related_name="docente"
    )
    legajo = models.IntegerField()
    fecha_ingreso = models.DateField(default=django.utils.timezone.localdate)
    
    
    class Meta:
        db_table = "docente"

    def __str__(self):
        return f"Docente {self.legajo}"

class ContactoEmergencia(models.Model):
    contacto_emergencia_id = models.AutoField(primary_key=True)

    persona = models.ForeignKey(
        Persona,
        on_delete=models.PROTECT,
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

class DocenteCategoria(models.Model):
    docente_categoria_id = models.AutoField(primary_key=True)

    docente = models.ForeignKey(
        Docente,
        on_delete=models.CASCADE,
        related_name="categorias_docente",
    )

    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name="docentes_categoria",
    )

    class Meta:
        db_table = "docente_categoria"
        constraints = [
            models.UniqueConstraint(
                fields=["docente", "categoria"],
                name="docente_categoria_unico",
            )
        ]