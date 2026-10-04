from django.db import migrations


def open_missing_current_accounts(apps, schema_editor):
    Socio = apps.get_model("padron", "Socio")
    CuentaCorriente = apps.get_model("finanzas", "CuentaCorriente")
    CuentaCorriente.objects.bulk_create([
        CuentaCorriente(socio=socio)
        for socio in Socio.objects.filter(cuenta_corriente__isnull=True)
    ])


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0025_refresh_settled_cuotas"),
        ("padron", "0023_rename_estadosocio_estadoadministrativo_and_more"),
    ]

    operations = [
        migrations.RunPython(open_missing_current_accounts, migrations.RunPython.noop),
    ]
