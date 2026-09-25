from datetime import datetime, time

from django.db import migrations
from django.utils import timezone


SCHEDULE_NAME = "tarea_generar_cuotas_mensuales"


def primer_dia_proximo_mes():
    hoy = timezone.localdate()
    if hoy.month == 12:
        anio = hoy.year + 1
        mes = 1
    else:
        anio = hoy.year
        mes = hoy.month + 1

    fecha = datetime.combine(datetime(anio, mes, 1).date(), time.min)
    return timezone.make_aware(fecha)


def configurar_schedule(apps, schema_editor):
    Schedule = apps.get_model("django_q", "Schedule")
    Schedule.objects.filter(name=SCHEDULE_NAME).update(
        schedule_type="M",
        cron="",
        repeats=-1,
        next_run=primer_dia_proximo_mes(),
    )


def restaurar_schedule(apps, schema_editor):
    Schedule = apps.get_model("django_q", "Schedule")
    Schedule.objects.filter(name=SCHEDULE_NAME).update(
        schedule_type="C",
        cron="0 0 1 * *",
        repeats=-1,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("finanzas", "0006_crear_schedule_cuotas"),
    ]

    operations = [
        migrations.RunPython(configurar_schedule, restaurar_schedule),
    ]