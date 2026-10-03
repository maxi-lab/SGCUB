import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0012_movimiento_cuota_data"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="cuota",
            name="cuenta_corriente",
        ),
        migrations.AlterField(
            model_name="movimientocuenta",
            name="pago",
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="movimiento", to="finanzas.pago"),
        ),
        migrations.AddConstraint(
            model_name="movimientocuenta",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(cuota__isnull=False, pago__isnull=True, movimiento_revertido__isnull=True)
                    | models.Q(cuota__isnull=True, pago__isnull=False, movimiento_revertido__isnull=True)
                    | models.Q(cuota__isnull=True, pago__isnull=True, movimiento_revertido__isnull=False)
                ),
                name="movimiento_cuenta_single_origin",
            ),
        ),
    ]
