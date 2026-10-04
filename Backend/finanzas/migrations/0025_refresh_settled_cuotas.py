from decimal import Decimal

from django.db import migrations
from django.db.models import Sum

PAID = "Paga"


def mark_settled_cuotas_as_paid(apps, schema_editor):
    Cuota = apps.get_model("finanzas", "Cuota")
    Imputacion = apps.get_model("finanzas", "Imputacion")
    applied = dict(
        Imputacion.objects.filter(movimiento_origen__reversion__isnull=True)
        .values("movimiento_destino__cuota")
        .annotate(total=Sum("monto_aplicado"))
        .values_list("movimiento_destino__cuota", "total")
    )
    settled_ids = [
        cuota_id
        for cuota_id, amount in Cuota.objects.filter(movimiento__isnull=False)
        .exclude(estado_cuota=PAID)
        .values_list("pk", "movimiento__monto")
        if amount - applied.get(cuota_id, Decimal("0.00")) <= 0
    ]
    Cuota.objects.filter(pk__in=settled_ids).update(estado_cuota=PAID)


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0024_remove_itemcuota_beca"),
    ]

    operations = [
        migrations.RunPython(mark_settled_cuotas_as_paid, migrations.RunPython.noop),
    ]
