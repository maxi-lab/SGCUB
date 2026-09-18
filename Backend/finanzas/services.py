from .models import CuentaCorriente, Cuota, EstadoCuota
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
			cuotas_creadas.append(cuota)

	return cuotas_creadas
