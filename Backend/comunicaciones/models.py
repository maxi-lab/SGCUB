from django.db import models

class CanalNotificacion(models.Model):
    nombre = models.CharField(max_length=50, unique=True) # Ej: Email, WhatsApp

    def __str__(self):
        return self.nombre

class EstadoNotificacion(models.Model):
    nombre = models.CharField(max_length=50, unique=True) # Ej: Pendiente, Enviado, Fallido

    def __str__(self):
        return self.nombre

class Notificacion(models.Model):
    titulo = models.CharField(max_length=150)
    asunto = models.CharField(max_length=150, blank=True, null=True)
    contenido = models.TextField()
    canal = models.ForeignKey(CanalNotificacion, on_delete=models.PROTECT)
    estado = models.ForeignKey(EstadoNotificacion, on_delete=models.PROTECT)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

class EnvioNotificacion(models.Model):
    notificacion = models.ForeignKey(Notificacion, related_name='envios', on_delete=models.CASCADE)
    destinatario_contacto = models.CharField(max_length=150) # Email o celular validado
    canal = models.ForeignKey(CanalNotificacion, on_delete=models.PROTECT)
    estado = models.ForeignKey(EstadoNotificacion, on_delete=models.PROTECT)
    detalle_fallo= models.TextField(blank=True, null=True)
    fecha_envio = models.DateTimeField(auto_now=True)
    fecha_lectura = models.DateTimeField(blank=True, null=True)
    fecha_recibido = models.DateTimeField(blank=True, null=True)