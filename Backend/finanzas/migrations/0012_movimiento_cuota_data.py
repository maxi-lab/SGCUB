from datetime import datetime, time

from django.db import migrations
from django.db.models import Count, Q
from django.utils import timezone


def backfill_cuota_charges(apps):
    Cuota = apps.get_model("finanzas", "Cuota")
    MovimientoCuenta = apps.get_model("finanzas", "MovimientoCuenta")

    for cuota in Cuota.objects.prefetch_related("items").order_by("pk"):
        items = list(cuota.items.all())
        if items:
            first_application = min(item.fecha_aplicacion for item in items)
            cuota.fecha_creacion = timezone.make_aware(datetime.combine(first_application, time.min))
            cuota.save(update_fields=["fecha_creacion"])

        if MovimientoCuenta.objects.filter(cuota=cuota).exists():
            continue

        MovimientoCuenta.objects.create(
            cuenta_corriente_id=cuota.cuenta_corriente_id,
            cuota=cuota,
            tipo_movimiento="Cargo",
            fecha=cuota.fecha_creacion,
            monto=sum((-item.monto if item.es_descuento else item.monto) for item in items),
            concepto=f"Cuota {cuota.periodo}"[:200],
        )


def relink_payment_reversals(apps):
    MovimientoCuenta = apps.get_model("finanzas", "MovimientoCuenta")

    reversals = MovimientoCuenta.objects.filter(pago__isnull=False, tipo_movimiento="Cargo").order_by("pk")
    for reversal in reversals:
        original = (
            MovimientoCuenta.objects.filter(pago_id=reversal.pago_id, tipo_movimiento="Abono")
            .order_by("pk")
            .first()
        )
        if original is None:
            continue
        reversal.movimiento_revertido = original
        reversal.pago = None
        reversal.save(update_fields=["movimiento_revertido", "pago"])


def check_consistency(apps):
    MovimientoCuenta = apps.get_model("finanzas", "MovimientoCuenta")
    errors = []

    origins = (
        Q(cuota__isnull=False, pago__isnull=True, movimiento_revertido__isnull=True)
        | Q(cuota__isnull=True, pago__isnull=False, movimiento_revertido__isnull=True)
        | Q(cuota__isnull=True, pago__isnull=True, movimiento_revertido__isnull=False)
    )
    invalid = list(MovimientoCuenta.objects.exclude(origins).values_list("pk", flat=True))
    if invalid:
        errors.append(f"movimientos sin un único origen (cuota, pago o reversión): {invalid}")

    shared_payments = list(
        MovimientoCuenta.objects.filter(pago__isnull=False)
        .values("pago_id")
        .annotate(total=Count("pk"))
        .filter(total__gt=1)
        .values_list("pago_id", flat=True)
    )
    if shared_payments:
        errors.append(f"pagos con más de un movimiento: {shared_payments}")

    if errors:
        raise RuntimeError(
            "No se puede vincular cuotas y pagos a movimientos: " + "; ".join(errors)
        )


def migrate_cuota_movements(apps, schema_editor):
    backfill_cuota_charges(apps)
    relink_payment_reversals(apps)
    check_consistency(apps)


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0011_movimiento_cuota_schema"),
    ]

    operations = [
        migrations.RunPython(migrate_cuota_movements, migrations.RunPython.noop),
    ]
