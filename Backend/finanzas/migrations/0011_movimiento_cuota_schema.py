import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0010_secuenciacomprobante"),
    ]

    operations = [
        migrations.RenameField(
            model_name="imputacion",
            old_name="monto",
            new_name="monto_aplicado",
        ),
        migrations.AddField(
            model_name="cuota",
            name="fecha_creacion",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name="movimientocuenta",
            name="cuota",
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="movimiento", to="finanzas.cuota"),
        ),
        migrations.AddField(
            model_name="movimientocuenta",
            name="movimiento_revertido",
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="reversion", to="finanzas.movimientocuenta"),
        ),
    ]
