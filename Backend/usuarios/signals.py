from django.contrib.auth import get_user_model
from django.db.models.signals import m2m_changed
from django.dispatch import receiver

from .roles import ADMINISTRADOR

User = get_user_model()


def sync_staff_flag(user):
    should_be_staff = user.is_superuser or user.groups.filter(name=ADMINISTRADOR).exists()
    if user.is_staff != should_be_staff:
        user.is_staff = should_be_staff
        user.save(update_fields=["is_staff"])


@receiver(m2m_changed, sender=User.groups.through)
def update_staff_flag_on_group_change(sender, instance, action, reverse, pk_set, **kwargs):
    if action not in ("post_add", "post_remove", "post_clear"):
        return

    if not reverse:
        # user.groups.add(...) / remove(...) / clear()
        sync_staff_flag(instance)
        return

    # group.user_set.add(...) / remove(...) / clear()
    if instance.name != ADMINISTRADOR:
        return
    users = User.objects.filter(pk__in=pk_set) if pk_set else User.objects.filter(is_staff=True)
    for user in users:
        sync_staff_flag(user)
