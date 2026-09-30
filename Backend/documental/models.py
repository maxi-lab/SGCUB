from django.db import models
from padron.models import Persona

class TipoDocumento(models.Model):
    id_tipo_documento = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)

    class Meta:
        db_table = "tipo_documento"

    def __str__(self):
        return self.nombre


class EstadoDocumento(models.Model):
    id_estado_documento = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=20)

    class Meta:
        db_table = "estado_documento"

    def __str__(self):
        return self.nombre


class Documento(models.Model):
    id_documento = models.AutoField(primary_key=True)
    tipo_documento = models.ForeignKey(TipoDocumento, on_delete=models.PROTECT, related_name='documentos')
    estado_documento = models.ForeignKey(EstadoDocumento, on_delete=models.PROTECT, related_name='documentos')
    persona = models.ForeignKey(Persona, on_delete=models.CASCADE, related_name='documentos')
    archivoUrl = models.CharField(max_length=200, blank=True, null=True)
    nombre = models.CharField(max_length=50)
    fecha_emision = models.DateTimeField(blank=True, null=True)
    fecha_recepcion = models.DateTimeField(blank=True, null=True)
    fecha_vencimiento = models.DateTimeField(blank=True, null=True)
    requiere_firma = models.BooleanField(default=False)

    class Meta:
        db_table = "documento"

    def __str__(self):
        return f"{self.nombre} - {self.persona}"
