from calendar import monthrange
from datetime import date
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from padron.models import (
    ESTADO_ADMINISTRATIVO_ACTIVO,
    ESTADO_DEPORTIVO_ACTIVO,
    Socio,
)

from .models import (
    CuentaCorriente,
    Cuota,
    EstadoCuotaChoices,
    ItemCuota,
    ConceptoItemChoices,
    SecuenciaComprobante,
)


def next_receipt_number():
    sequence, _ = SecuenciaComprobante.objects.select_for_update().get_or_create(pk=1)
    sequence.ultimo_numero += 1
    sequence.save(update_fields=["ultimo_numero"])
    return sequence.ultimo_numero


def _monto_configurado(nombre):
    valor = 1000
    try:
        monto = Decimal(str(valor)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        raise ImproperlyConfigured(
            f"Debe configurar {nombre} con un importe decimal mayor a cero."
        ) from None

    if monto <= 0:
        raise ImproperlyConfigured(
            f"Debe configurar {nombre} con un importe decimal mayor a cero."
        )
    return monto


def _fecha_vencimiento(anio, mes, dia):
    if not 1 <= dia <= 31:
        raise ImproperlyConfigured("Los días de vencimiento deben estar entre 1 y 31.")
    ultimo_dia = monthrange(anio, mes)[1]
    return date(anio, mes, min(dia, ultimo_dia))


def generar_cuotas_mensuales(fecha=None):
    """Genera una cuota por socio elegible para el mes de ``fecha``."""
    fecha = fecha or timezone.localdate()
    if not isinstance(fecha, date):
        raise TypeError("La fecha de generación debe ser una fecha.")

    monto_social = 1000
    monto_deportivo = 1500
    periodo = fecha.strftime("%Y-%m")
    fecha_aplicacion = date(fecha.year, fecha.month, 1)
    vencimiento_1 = _fecha_vencimiento(
        fecha.year,
        fecha.month,
        10,
    )
    vencimiento_2 = _fecha_vencimiento(
        fecha.year,
        fecha.month,
        20,
    )
    if vencimiento_2 < vencimiento_1:
        raise ImproperlyConfigured(
            "El segundo vencimiento no puede ser anterior al primero."
        )

    socios = (
        Socio.objects.filter(
            Q(estado_administrativo__nombre__iexact=ESTADO_ADMINISTRATIVO_ACTIVO)
            | Q(jugador__isnull=False)
        )
        .select_related("estado_administrativo", "jugador__estado")
        .order_by("pk")
    )
    resultado = {
        "periodo": periodo,
        "cuotas_creadas": 0,
        "cuotas_existentes": 0,
        "items_sociales": 0,
        "items_deportivos": 0,
    }

    with transaction.atomic():
        for socio in socios:
            cuenta, _ = CuentaCorriente.objects.get_or_create(socio=socio)
            cuenta = CuentaCorriente.objects.select_for_update().get(pk=cuenta.pk)
            if Cuota.objects.filter(cuenta_corriente=cuenta, periodo=periodo).exists():
                resultado["cuotas_existentes"] += 1
                continue

            cuota = Cuota.objects.create(
                cuenta_corriente=cuenta,
                estado_cuota=EstadoCuotaChoices.EN_FECHA,
                fecha_venc1=vencimiento_1,
                fecha_venc2=vencimiento_2,
                periodo=periodo,
            )
            ItemCuota.objects.create(
                cuota=cuota,
                concepto=ConceptoItemChoices.CUOTA_SOCIAL,
                fecha_aplicacion=fecha_aplicacion,
                monto=monto_social,
            )
            monto_total = monto_social
            resultado["items_sociales"] += 1

            jugador = getattr(socio, "jugador", None)
            if (
                jugador is not None
                and socio.estado_administrativo.nombre.casefold()
                == ESTADO_ADMINISTRATIVO_ACTIVO.casefold()
                and jugador.estado.nombre.casefold() == ESTADO_DEPORTIVO_ACTIVO.casefold()
            ):
                ItemCuota.objects.create(
                    cuota=cuota,
                    concepto=ConceptoItemChoices.CUOTA_DEPORTIVA,
                    fecha_aplicacion=fecha_aplicacion,
                    monto=monto_deportivo,
                )
                monto_total += monto_deportivo
                resultado["items_deportivos"] += 1

            cuenta.saldo -= monto_total
            cuenta.save(update_fields=["saldo"])
            resultado["cuotas_creadas"] += 1

    return resultado
