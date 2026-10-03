from datetime import datetime, time

import django.utils.timezone
from django.db import migrations, models
from django.utils import timezone


def copy_payment_datetime(apps, schema_editor):
    Pago = apps.get_model("finanzas", "Pago")
    MovimientoCuenta = apps.get_model("finanzas", "MovimientoCuenta")
    movement_dates = dict(
        MovimientoCuenta.objects.filter(pago__isnull=False).values_list("pago_id", "fecha")
    )
    for payment in Pago.objects.all():
        payment.fecha_hora = movement_dates.get(payment.pk) or timezone.make_aware(
            datetime.combine(payment.fecha, time.min)
        )
        payment.save(update_fields=["fecha_hora"])


def copy_payment_date(apps, schema_editor):
    Pago = apps.get_model("finanzas", "Pago")
    for payment in Pago.objects.all():
        payment.fecha = timezone.localdate(payment.fecha_hora)
        payment.save(update_fields=["fecha"])


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0022_backfill_detalle_imputacion"),
    ]

    operations = [
        migrations.AddField(
            model_name="pago",
            name="fecha_hora",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.RunPython(copy_payment_datetime, copy_payment_date),
        migrations.RemoveField(
            model_name="pago",
            name="fecha",
        ),
        migrations.RenameField(
            model_name="pago",
            old_name="fecha_hora",
            new_name="fecha",
        ),
    ]
