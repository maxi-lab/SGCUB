from django.db.models.signals import post_save
from django.dispatch import receiver

from padron.models import Socio

from .models import CuentaCorriente, EstadoCuentaCorrienteChoices


def account_state_for(socio):
    if socio.is_inactive:
        return EstadoCuentaCorrienteChoices.INACTIVO
    return EstadoCuentaCorrienteChoices.ACTIVO


@receiver(post_save, sender=Socio)
def sync_current_account(sender, instance, created, raw=False, **kwargs):
    if raw:
        return
    state = account_state_for(instance)
    if created:
        CuentaCorriente.objects.get_or_create(socio=instance, defaults={"estado_cuenta_corriente": state})
        return
    CuentaCorriente.objects.filter(socio=instance).exclude(estado_cuenta_corriente=state).update(
        estado_cuenta_corriente=state,
    )
