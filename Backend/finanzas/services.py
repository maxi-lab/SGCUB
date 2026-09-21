from datetime import date

from django.contrib.admin import models
from django.utils import timezone
from django.db.models import F

from .models import CuentaCorriente, Cuota, EstadoCuota, ItemCuota
from padron.models import Jugador


def crear_cuentas_corrientes_jugadores():
	"""Crea una cuenta corriente para cada jugador que todavía no tenga una."""
	cuentas_creadas = []

	for jugador in Jugador.objects.select_related("socio"):
		cuenta_corriente, creada = CuentaCorriente.objects.get_or_create(
			socio=jugador.socio,
			defaults={"saldo": 0},
		)
		if creada:
			cuentas_creadas.append(cuenta_corriente)

	return cuentas_creadas


def crear_cuotas_jugadores(fecha_venc1, fecha_venc2, periodo):
	"""Crea una cuota del período indicado para cada jugador."""
	estado_en_fecha, _ = EstadoCuota.objects.get_or_create(
		nombre=EstadoCuota.Valores.EN_FECHA,
	)
	cuotas_creadas = []

	for jugador in Jugador.objects.select_related("socio"):
		cuenta_corriente, _ = CuentaCorriente.objects.get_or_create(
			socio=jugador.socio,
			defaults={"saldo": 0},
		)
		cuota, creada = Cuota.objects.get_or_create( #si ya existe una cuota para ese jugador en ese periodo, no se crea otra
			cuenta_corriente=cuenta_corriente,
			periodo=periodo,
			defaults={
				"estado_cuota": estado_en_fecha,
				"fecha_venc1": fecha_venc1,
				"fecha_venc2": fecha_venc2,
			},
		)
		if creada:
			ItemCuota.objects.create(
                cuota=cuota,
                concepto=ItemCuota.Conceptos.CUOTA_SOCIAL,
                es_descuento=False,
                fecha_aplicacion=fecha_venc1,
                monto=1000,  # Asignar el monto correspondiente a la cuota social
                motivo="cuota social",
            )
			cuotas_creadas.append(cuota)
			CuentaCorriente.objects.filter(socio=jugador.socio).update(saldo=F("saldo") - 1000)  # Actualizar el saldo de la cuenta corriente
		
	return cuotas_creadas


def generar_cuotas_mensuales():
	"""Genera las cuotas del mes actual con vencimientos los días 10 y 20."""
	hoy = timezone.localdate()
	fecha_venc1 = date(hoy.year, hoy.month, 10)
	fecha_venc2 = date(hoy.year, hoy.month, 20)
	periodo = hoy.strftime("%Y-%m")

	return crear_cuotas_jugadores(fecha_venc1, fecha_venc2, periodo)
