from datetime import timedelta

from django.db import migrations
from django.utils import timezone

MONTHLY_GENERATION = "Finanzas - Generación mensual de cuotas"
DAILY_SURCHARGES = "Finanzas - Recargos por mora"


def next_monthly_run(now):
    candidate = now.replace(day=1, hour=1, minute=0, second=0, microsecond=0)
    if candidate <= now:
        candidate = (candidate + timedelta(days=32)).replace(day=1)
    return candidate


def next_daily_run(now):
    candidate = now.replace(hour=2, minute=0, second=0, microsecond=0)
    if candidate <= now:
        candidate += timedelta(days=1)
    return candidate


def create_schedules(apps, schema_editor):
    Schedule = apps.get_model("django_q", "Schedule")
    now = timezone.localtime()
    Schedule.objects.update_or_create(
        name=MONTHLY_GENERATION,
        defaults={
            "func": "finanzas.services.generar_cuotas_mensuales",
            "schedule_type": "M",
            "repeats": -1,
            "next_run": next_monthly_run(now),
        },
    )
    Schedule.objects.update_or_create(
        name=DAILY_SURCHARGES,
        defaults={
            "func": "finanzas.services.apply_surcharges",
            "schedule_type": "D",
            "repeats": -1,
            "next_run": next_daily_run(now),
        },
    )


def delete_schedules(apps, schema_editor):
    Schedule = apps.get_model("django_q", "Schedule")
    Schedule.objects.filter(name__in=[MONTHLY_GENERATION, DAILY_SURCHARGES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0018_cuota_recargos_aplicados"),
        ("django_q", "0019_alter_task_options_alter_ormq_key_alter_ormq_lock_and_more"),
    ]

    operations = [
        migrations.RunPython(create_schedules, delete_schedules),
    ]
