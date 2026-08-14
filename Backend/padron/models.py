from django.db import models


class Persona(models.Model):
    persona_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, default="")
    apellido = models.CharField(max_length=50, default="")
    dni = models.CharField(max_length=20, unique=True, default="")

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
    telefono = models.CharField(max_length=20, default="")

    class Meta:
        db_table = "socio"

    def __str__(self):
        return f"{self.persona.nombre} {self.persona.apellido}"


class Categoria(models.Model):
    categoria_id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)

    class Meta:
        db_table = "categoria"

    def __str__(self):
        return self.nombre


class Jugador(models.Model):
    jugador_id = models.AutoField(primary_key=True)
    socio = models.ForeignKey(
        Socio,
        on_delete=models.CASCADE,
        related_name="jugadores"
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name="jugadores"
    )

    class Meta:
        db_table = "jugador"

    def __str__(self):
        return f"Jugador {self.jugador_id}"


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