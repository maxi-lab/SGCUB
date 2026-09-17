from django.db import migrations


def crear_estados_cuota(apps, schema_editor):
    EstadoCuota = apps.get_model("finanzas", "EstadoCuota")

    for nombre in ("En Fecha", "Vencida", "Paga"):
        EstadoCuota.objects.get_or_create(nombre=nombre)


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0002_alter_estadocuota_nombre"),
    ]

    operations = [
        migrations.RunPython(crear_estados_cuota, migrations.RunPython.noop),
    ]