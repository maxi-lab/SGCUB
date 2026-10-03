from decimal import Decimal

from django.db import migrations

from finanzas.allocation import allocate_payment, concept_totals


def backfill_imputation_details(apps, schema_editor):
    Imputacion = apps.get_model("finanzas", "Imputacion")
    DetalleImputacion = apps.get_model("finanzas", "DetalleImputacion")
    ItemCuota = apps.get_model("finanzas", "ItemCuota")
    MovimientoCuenta = apps.get_model("finanzas", "MovimientoCuenta")

    reverted = set(
        MovimientoCuenta.objects.filter(movimiento_revertido__isnull=False)
        .values_list("movimiento_revertido_id", flat=True)
    )
    allocated_by_cuota = {}
    for imputation in Imputacion.objects.select_related("movimiento_destino").order_by("fecha", "pk"):
        cuota_id = imputation.movimiento_destino.cuota_id
        if cuota_id is None:
            continue

        existing = list(DetalleImputacion.objects.filter(imputacion=imputation))
        if existing:
            lines = {detail.concepto: detail.monto for detail in existing}
        else:
            charges, discounts = concept_totals(
                (item.concepto, item.monto, item.es_descuento)
                for item in ItemCuota.objects.filter(cuota_id=cuota_id)
            )
            lines = allocate_payment(
                charges,
                discounts,
                allocated_by_cuota.get(cuota_id, {}),
                imputation.monto_aplicado,
            )
            DetalleImputacion.objects.bulk_create([
                DetalleImputacion(imputacion=imputation, concepto=concept, monto=amount)
                for concept, amount in lines.items()
            ])

        if imputation.movimiento_origen_id not in reverted:
            allocated = allocated_by_cuota.setdefault(cuota_id, {})
            for concept, amount in lines.items():
                allocated[concept] = allocated.get(concept, Decimal("0.00")) + amount


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0021_detalle_imputacion"),
    ]

    operations = [
        migrations.RunPython(backfill_imputation_details, migrations.RunPython.noop),
    ]
