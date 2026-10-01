import os

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand

from usuarios.dni import normalize_dni, validate_dni
from usuarios.models import set_must_change_password
from usuarios.roles import ADMINISTRADOR

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Crea el usuario administrador inicial a partir de ADMIN_DNI y ADMIN_PASSWORD del .env. "
        "Si ya existe un usuario con ese DNI no hace nada."
    )

    # Se ejecuta en cada arranque del backend (ver docker-compose.yml): nunca debe cortar el arranque,
    # por eso los problemas de configuración se informan como advertencias y no como errores.
    def handle(self, *args, **options):
        dni = normalize_dni(os.environ.get("ADMIN_DNI", ""))
        password = os.environ.get("ADMIN_PASSWORD", "")

        if not dni or not password:
            self.stdout.write("ADMIN_DNI o ADMIN_PASSWORD no están definidos en el .env: no se crea el administrador inicial.")
            return

        try:
            validate_dni(dni)
        except ValidationError as error:
            self.stderr.write(self.style.WARNING(f"ADMIN_DNI inválido ({dni}): {' '.join(error.messages)}"))
            return

        if User.objects.filter(username=dni).exists():
            self.stdout.write(f"El administrador inicial ({dni}) ya existe.")
            return

        user = User.objects.create_user(username=dni, password=password, first_name="Administrador")
        user.groups.add(Group.objects.get(name=ADMINISTRADOR))
        # La clave del .env la conoce todo el equipo: se pide cambiarla en el primer ingreso
        set_must_change_password(user)
        self.stdout.write(self.style.SUCCESS(f"Administrador inicial creado con DNI {dni}."))
