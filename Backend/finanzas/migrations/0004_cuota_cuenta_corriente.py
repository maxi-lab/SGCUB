from django.db import migrations, models
import django.db.models.deletion


def migrar_cuotas_a_cuentas_corrientes(apps, schema_editor):
    Cuota = apps.get_model("finanzas", "Cuota")
    CuentaCorriente = apps.get_model("finanzas", "CuentaCorriente")

    for cuota in Cuota.objects.select_related("socio").all():
        cuenta_corriente, _ = CuentaCorriente.objects.get_or_create(
            socio_id=cuota.socio_id,
            defaults={"saldo": 0},
        )
        cuota.cuenta_corriente_id = cuenta_corriente.pk
        cuota.save(update_fields=["cuenta_corriente"])


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0003_seed_estados_cuota"),
    ]

    operations = [
        migrations.AddField(
            model_name="cuota",
            name="cuenta_corriente",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="cuotas_nuevas",
                to="finanzas.cuentacorriente",
            ),
        ),
        migrations.RunPython(
            migrar_cuotas_a_cuentas_corrientes,
            migrations.RunPython.noop,
        ),
        migrations.RemoveField(
            model_name="cuota",
            name="socio",
        ),
        migrations.AlterField(
            model_name="cuota",
            name="cuenta_corriente",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="cuotas",
                to="finanzas.cuentacorriente",
            ),
        ),
    ]