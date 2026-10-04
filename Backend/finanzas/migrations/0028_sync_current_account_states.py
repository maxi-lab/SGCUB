from django.db import migrations

ACTIVE = "Activo"
INACTIVE = "Inactivo"


def sync_current_account_states(apps, schema_editor):
    CuentaCorriente = apps.get_model("finanzas", "CuentaCorriente")
    inactive = CuentaCorriente.objects.filter(socio__estado_administrativo__nombre=INACTIVE)
    inactive.exclude(estado_cuenta_corriente=INACTIVE).update(estado_cuenta_corriente=INACTIVE)
    CuentaCorriente.objects.exclude(socio__estado_administrativo__nombre=INACTIVE).exclude(
        estado_cuenta_corriente=ACTIVE,
    ).update(estado_cuenta_corriente=ACTIVE)


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0027_concepto_item_labels"),
        ("padron", "0023_rename_estadosocio_estadoadministrativo_and_more"),
    ]

    operations = [
        migrations.RunPython(sync_current_account_states, migrations.RunPython.noop),
    ]
