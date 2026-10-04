from django.db.models.signals import post_save
from django.dispatch import receiver

from padron.models import Socio

from .models import CuentaCorriente


@receiver(post_save, sender=Socio)
def open_current_account(sender, instance, created, raw=False, **kwargs):
    if created and not raw:
        CuentaCorriente.objects.get_or_create(socio=instance)
