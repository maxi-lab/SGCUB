from django.db import migrations


SCHEDULE_NAME = "tarea_generar_cuotas_mensuales"


def crear_schedule(apps, schema_editor):
    Schedule = apps.get_model("django_q", "Schedule")
    Schedule.objects.update_or_create(
        name=SCHEDULE_NAME,
        defaults={
            "func": "finanzas.services.generar_cuotas_mensuales",
            "schedule_type": "C",
            "cron": "0 0 1 * *",
            "repeats": -1,
        },
    )


def eliminar_schedule(apps, schema_editor):
    Schedule = apps.get_model("django_q", "Schedule")
    Schedule.objects.filter(name=SCHEDULE_NAME).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("finanzas", "0005_alter_itemcuota_concepto"),
        ("django_q", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(crear_schedule, eliminar_schedule),
    ]