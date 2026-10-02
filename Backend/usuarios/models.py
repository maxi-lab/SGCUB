from django.conf import settings
from django.db import models

class Perfil(models.Model):
    # Datos propios del sistema que el User de Django no tiene
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="perfil")
    # Se activa al crear el usuario o resetear su contraseña (la clave pasa a ser el DNI)
    must_change_password = models.BooleanField(default=False)

    class Meta:
        db_table = "perfil"

    def __str__(self):
        return f"Perfil de {self.user}"


def set_must_change_password(user, required=True):
    Perfil.objects.update_or_create(user=user, defaults={"must_change_password": required})


def must_change_password(user):
    # Los usuarios creados antes de existir el Perfil (o por createsuperuser) no tienen uno
    try:
        return user.perfil.must_change_password
    except Perfil.DoesNotExist:
        return False
