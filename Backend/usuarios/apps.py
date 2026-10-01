from django.apps import AppConfig
from django.db.models.signals import post_migrate

#Sincroniza los grupos despues de cada migrate, sin necesidad de data migrations

def _sync_roles(sender, **kwargs):
    from .roles import sync_roles

    sync_roles()


class UsuariosConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "usuarios"

    def ready(self):
        from . import signals  # noqa: F401
        post_migrate.connect(_sync_roles, sender=self)
