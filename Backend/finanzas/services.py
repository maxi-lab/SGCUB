from calendar import monthrange
from datetime import date, datetime
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from padron.models import ESTADO_ADMINISTRATIVO_ACTIVO, Socio

from .generators import GeneradorItemsCuota
from .models import (
    Comprobante,
    ConceptoItemChoices,
    ConfiguracionFinanciera,
    CuentaCorriente,
    Cuota,
    EstadoComprobanteChoices,
    EstadoCuotaChoices,
    EstadoPagoChoices,
    Imputacion,
    ItemCuota,
    ItemPago,
    MovimientoCuenta,
    Pago,
    SecuenciaComprobante,
    TipoMovimientoChoices,
)

PERIOD_FORMAT = "%Y-%m"


class CuotaDuplicadaError(Exception):
    pass


class SocioInactivoError(Exception):
    pass


class PagoInvalidoError(Exception):
    pass


class CuotaConPagosError(Exception):
    pass


def next_receipt_number():
    sequence, _ = SecuenciaComprobante.objects.select_for_update().get_or_create(pk=1)
    sequence.ultimo_numero += 1
    sequence.save(update_fields=["ultimo_numero"])
    return sequence.ultimo_numero


def net_amount(items):
    return sum(
        ((-item.monto if item.es_descuento else item.monto) for item in items),
        Decimal("0.00"),
    )


def parse_period(period):
    try:
        return datetime.strptime(str(period).strip(), PERIOD_FORMAT).date()
    except ValueError:
        raise ValueError("El período debe tener el formato AAAA-MM.") from None


def due_date(first_day, day):
    return first_day.replace(day=min(day, monthrange(first_day.year, first_day.month)[1]))


def lock_account(socio):
    account, _ = CuentaCorriente.objects.get_or_create(socio=socio)
    return CuentaCorriente.objects.select_for_update().get(pk=account.pk)


def lock_cuota_charge(cuota):
    account_id = MovimientoCuenta.objects.values_list("cuenta_corriente_id", flat=True).get(cuota=cuota)
    account = CuentaCorriente.objects.select_for_update().get(pk=account_id)
    movement = MovimientoCuenta.objects.select_for_update().get(cuota=cuota)
    return account, movement


@transaction.atomic
def create_cuota(socio, period, first_due_date=None, second_due_date=None, configuration=None):
    configuration = configuration or ConfiguracionFinanciera.load()
    first_day = parse_period(period)
    period = first_day.strftime(PERIOD_FORMAT)
    items = GeneradorItemsCuota(socio, first_day, configuration).build_items()
    if not items:
        raise SocioInactivoError("El socio no está activo; no corresponde generar cuota.")

    account = lock_account(socio)
    if account.cuotas.filter(periodo=period).exists():
        raise CuotaDuplicadaError(f"El socio ya tiene una cuota para el período {period}.")

    cuota = Cuota.objects.create(
        periodo=period,
        fecha_venc1=first_due_date or due_date(first_day, configuration.dia_vencimiento_1),
        fecha_venc2=second_due_date or due_date(first_day, configuration.dia_vencimiento_2),
    )
    for item in items:
        item.cuota = cuota
    ItemCuota.objects.bulk_create(items)

    amount = net_amount(items)
    MovimientoCuenta.objects.create(
        cuenta_corriente=account,
        cuota=cuota,
        tipo_movimiento=TipoMovimientoChoices.CARGO,
        fecha=timezone.now(),
        monto=amount,
        concepto=f"Cuota {period}",
    )
    account.saldo -= amount
    account.save(update_fields=["saldo"])
    return cuota


def ensure_cuota_without_payments(cuota):
    if Imputacion.objects.filter(movimiento_destino__cuota=cuota).exists():
        raise CuotaConPagosError("La cuota tiene pagos aplicados y no puede modificarse.")


@transaction.atomic
def sync_cuota_charge(cuota):
    account, movement = lock_cuota_charge(cuota)
    amount = net_amount(ItemCuota.objects.filter(cuota=cuota))
    account.saldo -= amount - movement.monto
    account.save(update_fields=["saldo"])
    movement.monto = amount
    movement.save(update_fields=["monto"])


@transaction.atomic
def delete_cuota(cuota):
    account, movement = lock_cuota_charge(cuota)
    ensure_cuota_without_payments(cuota)
    account.saldo += movement.monto
    account.save(update_fields=["saldo"])
    cuota.delete()


def generar_cuotas_mensuales(fecha=None):
    fecha = fecha or timezone.localdate()
    if not isinstance(fecha, date):
        raise TypeError("La fecha de generación debe ser una fecha.")

    period = fecha.strftime(PERIOD_FORMAT)
    configuration = ConfiguracionFinanciera.load()
    socios = (
        Socio.objects.filter(estado_administrativo__nombre__iexact=ESTADO_ADMINISTRATIVO_ACTIVO)
        .select_related("estado_administrativo", "jugador__estado")
        .order_by("pk")
    )
    result = {
        "periodo": period,
        "cuotas_creadas": 0,
        "cuotas_existentes": 0,
        "items_sociales": 0,
        "items_deportivos": 0,
    }

    for socio in socios:
        try:
            cuota = create_cuota(socio, period, configuration=configuration)
        except CuotaDuplicadaError:
            result["cuotas_existentes"] += 1
            continue
        except SocioInactivoError:
            continue

        concepts = list(cuota.items.values_list("concepto", flat=True))
        result["cuotas_creadas"] += 1
        result["items_sociales"] += concepts.count(ConceptoItemChoices.CUOTA_SOCIAL)
        result["items_deportivos"] += concepts.count(ConceptoItemChoices.CUOTA_DEPORTIVA)

    return result


def pending_amounts(cuotas, ignored_origin=None):
    cuota_ids = [cuota.pk for cuota in cuotas]
    imputations = Imputacion.objects.filter(movimiento_destino__cuota__in=cuota_ids)
    imputed_cuota_ids = set(imputations.values_list("movimiento_destino__cuota", flat=True))
    active = imputations.filter(movimiento_origen__reversion__isnull=True)
    if ignored_origin is not None:
        active = active.exclude(movimiento_origen=ignored_origin)
    applied = dict(
        active.values("movimiento_destino__cuota")
        .annotate(total=Sum("monto_aplicado"))
        .values_list("movimiento_destino__cuota", "total")
    )

    pending = {}
    for cuota in cuotas:
        if cuota.estado_cuota == EstadoCuotaChoices.PAGA and cuota.pk not in imputed_cuota_ids:
            pending[cuota.pk] = Decimal("0.00")
        else:
            pending[cuota.pk] = cuota.movimiento.monto - applied.get(cuota.pk, Decimal("0.00"))
    return pending


def refresh_cuota_state(cuota, pending, today=None):
    today = today or timezone.localdate()
    if pending <= 0:
        state = EstadoCuotaChoices.PAGA
    elif today > cuota.fecha_venc1:
        state = EstadoCuotaChoices.VENCIDA
    else:
        state = EstadoCuotaChoices.EN_FECHA
    if cuota.estado_cuota != state:
        cuota.estado_cuota = state
        cuota.save(update_fields=["estado_cuota"])


def apply_payment(payment_movement, cuotas, amount):
    pending = pending_amounts(cuotas)
    remaining = amount
    today = timezone.localdate()
    imputations = []
    for cuota in sorted(cuotas, key=lambda cuota: (cuota.periodo, cuota.pk)):
        applied = min(remaining, max(pending[cuota.pk], Decimal("0.00")))
        if applied > 0:
            imputations.append(Imputacion.objects.create(
                movimiento_origen=payment_movement,
                movimiento_destino=cuota.movimiento,
                fecha=timezone.now(),
                monto_aplicado=applied,
            ))
            remaining -= applied
        refresh_cuota_state(cuota, pending[cuota.pk] - applied, today)
    return imputations


def lock_account_cuotas(account, cuota_ids):
    cuotas = list(
        Cuota.objects.select_for_update(of=("self",))
        .filter(movimiento__cuenta_corriente=account, cuota_id__in=cuota_ids)
        .select_related("movimiento")
    )
    if len(cuotas) != len(set(cuota_ids)):
        raise PagoInvalidoError("Una o más cuotas no pertenecen a este socio.")
    return cuotas


def validate_payment_amount(pending, total, paid_message):
    if any(amount <= 0 for amount in pending.values()):
        raise PagoInvalidoError(paid_message)
    if total > sum(pending.values(), Decimal("0.00")):
        raise PagoInvalidoError("El pago supera el saldo pendiente de las cuotas seleccionadas.")


def create_payment(account, payment_methods, total, note, user, concept):
    payment = Pago.objects.create(
        usuario=user,
        estado_pago=EstadoPagoChoices.ACREDITADO,
        fecha=timezone.localdate(),
        observacion=note,
    )
    ItemPago.objects.bulk_create([
        ItemPago(pago=payment, medio_de_pago=method["medio_de_pago"], monto=method["monto"])
        for method in payment_methods
    ])
    receipt = Comprobante.objects.create(
        pago=payment,
        fecha_emision=timezone.localdate(),
        numero=next_receipt_number(),
        monto_total=total,
    )
    movement = MovimientoCuenta.objects.create(
        cuenta_corriente=account,
        pago=payment,
        tipo_movimiento=TipoMovimientoChoices.ABONO,
        fecha=timezone.now(),
        monto=total,
        concepto=concept[:200],
    )
    return payment, receipt, movement


@transaction.atomic
def register_payment(socio_id, cuota_ids, payment_methods, total, note="", user=None):
    account = CuentaCorriente.objects.select_for_update().get(socio_id=socio_id)
    cuotas = lock_account_cuotas(account, cuota_ids)
    validate_payment_amount(pending_amounts(cuotas), total, "No se pueden pagar cuotas ya saldadas.")

    payment, receipt, movement = create_payment(account, payment_methods, total, note, user, "Pago de cuotas")
    account.saldo += total
    account.save(update_fields=["saldo"])
    apply_payment(movement, cuotas, total)
    return payment, receipt


@transaction.atomic
def correct_payment(payment_id, cuota_ids, payment_methods, total, reason, user=None):
    original = Pago.objects.select_for_update().get(pk=payment_id)
    if original.estado_pago != EstadoPagoChoices.ACREDITADO:
        raise PagoInvalidoError("Solo se pueden corregir pagos acreditados.")
    original_receipt = Comprobante.objects.select_for_update().filter(pago=original).first()
    original_movement = MovimientoCuenta.objects.select_for_update().filter(pago=original).first()
    if original_receipt is None or original_movement is None:
        raise PagoInvalidoError("El pago original no tiene comprobante o movimiento de cuenta para revertir.")

    account = CuentaCorriente.objects.select_for_update().get(pk=original_movement.cuenta_corriente_id)
    cuotas = lock_account_cuotas(account, cuota_ids)
    validate_payment_amount(
        pending_amounts(cuotas, ignored_origin=original_movement),
        total,
        "No se puede imputar la corrección a cuotas ya saldadas.",
    )
    previously_covered_ids = set(
        Imputacion.objects.filter(movimiento_origen=original_movement)
        .values_list("movimiento_destino__cuota", flat=True)
    ) - {cuota.pk for cuota in cuotas}
    previously_covered = list(
        Cuota.objects.select_for_update(of=("self",))
        .filter(pk__in=previously_covered_ids)
        .select_related("movimiento")
    )

    replacement, receipt, movement = create_payment(
        account,
        payment_methods,
        total,
        f"Sustituye al pago #{original.pk}.",
        user,
        f"Pago corregido; sustituye al pago #{original.pk}.",
    )
    MovimientoCuenta.objects.create(
        cuenta_corriente=account,
        movimiento_revertido=original_movement,
        tipo_movimiento=TipoMovimientoChoices.CARGO,
        fecha=timezone.now(),
        monto=original_movement.monto,
        concepto=f"Reversión del pago #{original.pk}. Sustituido por #{replacement.pk}."[:200],
    )
    account.saldo += total - original_movement.monto
    account.save(update_fields=["saldo"])

    original.estado_pago = EstadoPagoChoices.ANULADO
    original.motivo_anulacion = reason
    original.save(update_fields=["estado_pago", "motivo_anulacion"])
    original_receipt.estado = EstadoComprobanteChoices.ANULADO
    original_receipt.reemplazado_por = receipt
    original_receipt.save(update_fields=["estado", "reemplazado_por"])

    apply_payment(movement, cuotas, total)
    pending = pending_amounts(previously_covered)
    for cuota in previously_covered:
        refresh_cuota_state(cuota, pending[cuota.pk])
    return original, original_receipt, replacement, receipt


SURCHARGE_LABELS = {1: "primer", 2: "segundo"}


def apply_cuota_surcharges(cuota_id, today, configuration):
    with transaction.atomic():
        account_id = MovimientoCuenta.objects.values_list("cuenta_corriente_id", flat=True).get(cuota_id=cuota_id)
        CuentaCorriente.objects.select_for_update().get(pk=account_id)
        cuota = Cuota.objects.select_for_update(of=("self",)).select_related("movimiento").get(pk=cuota_id)
        if pending_amounts([cuota])[cuota.pk] <= 0:
            return []

        base_amount = net_amount(cuota.items.exclude(concepto=ConceptoItemChoices.MORA))
        surcharges = []
        for number, due in ((1, cuota.fecha_venc1), (2, cuota.fecha_venc2)):
            if cuota.recargos_aplicados >= number or today <= due:
                continue
            amount = configuration.surcharge(number, base_amount)
            if amount > 0:
                surcharges.append((number, ItemCuota.objects.create(
                    cuota=cuota,
                    concepto=ConceptoItemChoices.MORA,
                    fecha_aplicacion=today,
                    monto=amount,
                    motivo=f"Recargo por {SURCHARGE_LABELS[number]} vencimiento ({due:%d/%m/%Y})",
                )))
            cuota.recargos_aplicados = number
        cuota.save(update_fields=["recargos_aplicados"])

        if surcharges:
            sync_cuota_charge(cuota)
            cuota.movimiento.refresh_from_db(fields=["monto"])
        refresh_cuota_state(cuota, pending_amounts([cuota])[cuota.pk], today)
        return surcharges


def apply_surcharges(today=None):
    today = today or timezone.localdate()
    configuration = ConfiguracionFinanciera.load()
    cuota_ids = list(
        Cuota.objects.filter(fecha_venc1__lt=today, recargos_aplicados__lt=2, movimiento__isnull=False)
        .exclude(estado_cuota=EstadoCuotaChoices.PAGA)
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    result = {
        "fecha": today.isoformat(),
        "cuotas_revisadas": len(cuota_ids),
        "recargos_primer_vencimiento": 0,
        "recargos_segundo_vencimiento": 0,
        "monto_total": Decimal("0.00"),
    }
    for cuota_id in cuota_ids:
        for number, item in apply_cuota_surcharges(cuota_id, today, configuration):
            key = "recargos_primer_vencimiento" if number == 1 else "recargos_segundo_vencimiento"
            result[key] += 1
            result["monto_total"] += item.monto
    return result
