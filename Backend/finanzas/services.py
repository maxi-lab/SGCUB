from calendar import monthrange
from datetime import date, datetime
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from padron.models import ESTADO_ADMINISTRATIVO_ACTIVO, Socio

from .generators import GeneradorItemsCuota
from .models import (
    ConceptoItemChoices,
    CuentaCorriente,
    Cuota,
    ItemCuota,
    MovimientoCuenta,
    SecuenciaComprobante,
    TipoMovimientoChoices,
)

FIRST_DUE_DAY = 10
SECOND_DUE_DAY = 20
PERIOD_FORMAT = "%Y-%m"


class CuotaDuplicadaError(Exception):
    pass


class SocioInactivoError(Exception):
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
def create_cuota(socio, period, first_due_date=None, second_due_date=None):
    first_day = parse_period(period)
    period = first_day.strftime(PERIOD_FORMAT)
    items = GeneradorItemsCuota(socio, first_day).build_items()
    if not items:
        raise SocioInactivoError("El socio no está activo; no corresponde generar cuota.")

    account = lock_account(socio)
    if account.cuotas.filter(periodo=period).exists():
        raise CuotaDuplicadaError(f"El socio ya tiene una cuota para el período {period}.")

    cuota = Cuota.objects.create(
        periodo=period,
        fecha_venc1=first_due_date or due_date(first_day, FIRST_DUE_DAY),
        fecha_venc2=second_due_date or due_date(first_day, SECOND_DUE_DAY),
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
    account.saldo += movement.monto
    account.save(update_fields=["saldo"])
    cuota.delete()


def generar_cuotas_mensuales(fecha=None):
    fecha = fecha or timezone.localdate()
    if not isinstance(fecha, date):
        raise TypeError("La fecha de generación debe ser una fecha.")

    period = fecha.strftime(PERIOD_FORMAT)
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

    with transaction.atomic():
        for socio in socios:
            try:
                cuota = create_cuota(socio, period)
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
