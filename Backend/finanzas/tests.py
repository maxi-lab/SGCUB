from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from padron.models import (
	ESTADO_ADMINISTRATIVO_INACTIVO,
	ESTADO_DEPORTIVO_INACTIVO,
	Categoria,
	EstadoAdministrativo,
	EstadoDeportivo,
	Jugador,
	Persona,
	Socio,
)
from .models import (
	Comprobante,
	CuentaCorriente,
	Cuota,
	EstadoCuotaChoices,
	ItemCuota,
	ItemPago,
	MovimientoCuenta,
	Pago,
)
from .services import generar_cuotas_mensuales


@override_settings(
	FINANZAS_CUOTA_SOCIAL_MONTO="100.00",
	FINANZAS_CUOTA_DEPORTIVA_MONTO="50.00",
	FINANZAS_DIA_VENCIMIENTO_1=10,
	FINANZAS_DIA_VENCIMIENTO_2=20,
)
class GeneracionCuotasMensualesTests(TestCase):
	def crear_socio(
		self,
		dni,
		socio_inactivo=False,
		con_jugador=False,
		jugador_inactivo=False,
	):
		persona = Persona.objects.create(
			nombre="Socio",
			apellido="Prueba",
			dni=dni,
		)
		socio = Socio.objects.create(persona=persona)
		if socio_inactivo:
			socio.estado_administrativo = EstadoAdministrativo.objects.get_or_create(
				nombre=ESTADO_ADMINISTRATIVO_INACTIVO,
			)[0]
			socio.save(update_fields=["estado_administrativo"])

		if con_jugador:
			estado_deportivo = EstadoDeportivo.objects.get_or_create(
				nombre=(
					ESTADO_DEPORTIVO_INACTIVO if jugador_inactivo else "Activo"
				),
			)[0]
			Jugador.objects.create(
				socio=socio,
				categoria=Categoria.objects.create(
					nombre=f"Categoria {dni}",
					anio_vigente=2026,
					edad_maxima=18,
				),
				estado=estado_deportivo,
			)
		return socio

	def test_generacion_cobra_social_y_suspende_solo_deportiva(self):
		socios = [
			self.crear_socio("10000001"),
			self.crear_socio(
				"10000002",
				con_jugador=True,
				jugador_inactivo=True,
			),
			self.crear_socio(
				"10000003",
				socio_inactivo=True,
				con_jugador=True,
			),
			self.crear_socio("10000004"),
		]

		resultado = generar_cuotas_mensuales(date(2026, 10, 5))

		self.assertEqual(resultado["cuotas_creadas"], 4)
		self.assertEqual(resultado["items_sociales"], 4)
		self.assertEqual(resultado["items_deportivos"], 0)
		for socio in socios:
			cuota = Cuota.objects.get(
				cuenta_corriente__socio=socio,
				periodo="2026-10",
			)
			self.assertEqual(
				list(cuota.items.values_list("concepto", flat=True)),
				["CuotaSocial"],
			)

	def test_jugador_activo_generacion_repetida_no_duplica(self):
		socio = self.crear_socio("10000011", con_jugador=True)

		primer_resultado = generar_cuotas_mensuales(date(2026, 10, 1))
		segundo_resultado = generar_cuotas_mensuales(date(2026, 10, 31))

		cuenta = CuentaCorriente.objects.get(socio=socio)
		cuota = Cuota.objects.get(cuenta_corriente=cuenta, periodo="2026-10")
		self.assertEqual(primer_resultado["cuotas_creadas"], 1)
		self.assertEqual(primer_resultado["items_deportivos"], 1)
		self.assertEqual(segundo_resultado["cuotas_creadas"], 0)
		self.assertEqual(segundo_resultado["cuotas_existentes"], 1)
		self.assertEqual(Cuota.objects.filter(cuenta_corriente=cuenta).count(), 1)
		self.assertEqual(cuota.items.count(), 2)
		self.assertEqual(cuenta.saldo, Decimal("-150.00"))

	def test_endpoint_manual_ejecuta_generacion(self):
		self.crear_socio("10000012")

		response = self.client.post(reverse("generar-cuotas-mensuales"))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["cuotas_creadas"], 1)
		self.assertEqual(response.data["items_sociales"], 1)


class CorregirPagoTests(APITestCase):
	def setUp(self):
		self.root = get_user_model().objects.create_user(
			username="root",
			is_staff=True,
			is_superuser=True,
		)
		self.client.force_authenticate(user=self.root)

		persona = Persona.objects.create(nombre="Ana", apellido="Perez", dni="12345678")
		socio = Socio.objects.create(persona=persona)
		self.cuenta = CuentaCorriente.objects.create(socio=socio, saldo=Decimal("100.00"))
		self.cuota_original = self.crear_cuota("Original", "100.00", EstadoCuotaChoices.PAGA)
		self.cuota_corregida = self.crear_cuota("Corregida", "50.00", EstadoCuotaChoices.EN_FECHA)

		self.pago_original = Pago.objects.create(
			usuario=self.root,
			estado_pago="Acreditado",
			fecha=date(2026, 9, 30),
		)
		ItemPago.objects.create(
			pago=self.pago_original,
			medio_de_pago="Efectivo",
			monto=Decimal("100.00"),
		)
		self.comprobante_original = Comprobante.objects.create(
			pago=self.pago_original,
			fecha_emision=date(2026, 9, 30),
			numero=1,
			monto_total=Decimal("100.00"),
		)
		MovimientoCuenta.objects.create(
			cuenta_corriente=self.cuenta,
			pago=self.pago_original,
			tipo_movimiento="Abono",
			fecha="2026-09-30T12:00:00Z",
			monto=Decimal("100.00"),
			concepto="Pago de cuotas",
		)

	def crear_cuota(self, periodo, monto, estado):
		cuota = Cuota.objects.create(
			cuenta_corriente=self.cuenta,
			estado_cuota=estado,
			fecha_venc1=date(2026, 9, 10),
			fecha_venc2=date(2026, 9, 20),
			periodo=periodo,
		)
		ItemCuota.objects.create(
			cuota=cuota,
			concepto="CuotaSocial",
			fecha_aplicacion=date(2026, 9, 1),
			monto=Decimal(monto),
		)
		return cuota

	def test_crea_reemplazo_anula_original_y_conserva_trazabilidad(self):
		response = self.client.post(
			reverse("corregir-pago", args=[self.pago_original.pk]),
			{
				"motivo": "Se registró un monto incorrecto",
				"cuota_ids": [self.cuota_corregida.pk],
				"monto_total": "50.00",
				"medios": [{"medio_de_pago": "Transferencia", "monto": "50.00"}],
			},
			format="json",
		)

		self.assertEqual(response.status_code, 201, response.data)
		self.pago_original.refresh_from_db()
		self.cuenta.refresh_from_db()
		self.assertEqual(self.pago_original.estado_pago, "Anulado")
		self.assertIn(f"#{response.data['pago']['pago_id']}", self.pago_original.observacion)
		self.assertEqual(self.cuenta.saldo, Decimal("50.00"))
		self.assertTrue(Comprobante.objects.filter(pk=self.comprobante_original.pk).exists())
		self.assertEqual(response.data["pago"]["usuario"], self.root.pk)
		self.assertIn(f"#{self.pago_original.pk}", response.data["pago"]["observacion"])
		self.assertEqual(
			MovimientoCuenta.objects.filter(pago=self.pago_original, tipo_movimiento="Cargo").count(),
			1,
		)
		self.assertEqual(
			MovimientoCuenta.objects.filter(pago_id=response.data["pago"]["pago_id"], tipo_movimiento="Abono").count(),
			1,
		)
		self.assertEqual(self.cuota_corregida.__class__.objects.get(pk=self.cuota_corregida.pk).estado_cuota, EstadoCuotaChoices.PAGA)

	def test_no_permite_borrar_pago_ni_comprobante_original(self):
		pago_response = self.client.delete(reverse("pago-detail", args=[self.pago_original.pk]))
		comprobante_response = self.client.delete(reverse("comprobante-detail", args=[self.comprobante_original.pk]))

		self.assertEqual(pago_response.status_code, 405)
		self.assertEqual(comprobante_response.status_code, 405)
		self.assertTrue(Pago.objects.filter(pk=self.pago_original.pk).exists())
		self.assertTrue(Comprobante.objects.filter(pk=self.comprobante_original.pk).exists())
