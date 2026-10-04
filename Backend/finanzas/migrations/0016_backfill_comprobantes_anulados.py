import re

from django.db import migrations

REPLACEMENT_PATTERN = re.compile(r"Sustituido por pago #(\d+)\.(?:\s*Motivo:\s*(.*))?", re.DOTALL)


def backfill_cancelled_receipts(apps, schema_editor):
    Comprobante = apps.get_model("finanzas", "Comprobante")
    Pago = apps.get_model("finanzas", "Pago")

    for payment in Pago.objects.filter(estado_pago="Anulado"):
        receipt = Comprobante.objects.filter(pago=payment).first()
        match = REPLACEMENT_PATTERN.search(payment.observacion or "")
        if match and match.group(2) and not payment.motivo_anulacion:
            payment.motivo_anulacion = match.group(2).strip()
            payment.save(update_fields=["motivo_anulacion"])
        if receipt is None:
            continue

        receipt.estado = "Anulado"
        if match and receipt.reemplazado_por_id is None:
            replacement = Comprobante.objects.filter(pago_id=int(match.group(1))).first()
            if replacement is not None and not Comprobante.objects.filter(reemplazado_por=replacement).exists():
                receipt.reemplazado_por = replacement
        receipt.save(update_fields=["estado", "reemplazado_por"])


class Migration(migrations.Migration):

    dependencies = [
        ("finanzas", "0015_trazabilidad_correccion_pagos"),
    ]

    operations = [
        migrations.RunPython(backfill_cancelled_receipts, migrations.RunPython.noop),
    ]
