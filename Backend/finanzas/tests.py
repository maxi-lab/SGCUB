from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from padron.models import Persona, Socio
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
