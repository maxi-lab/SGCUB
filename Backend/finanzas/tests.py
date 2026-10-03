from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase
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
from .generators import GeneradorItemsCuota
from .models import (
	Comprobante,
	CuentaCorriente,
	Cuota,
	EstadoCuotaChoices,
	Imputacion,
	ItemCuota,
	ItemPago,
	MovimientoCuenta,
	Pago,
	SecuenciaComprobante,
)
from .services import generar_cuotas_mensuales, next_receipt_number


def crear_socio(dni, socio_inactivo=False, con_jugador=False, jugador_inactivo=False):
	persona = Persona.objects.create(nombre="Socio", apellido="Prueba", dni=dni)
	socio = Socio.objects.create(persona=persona)
	if socio_inactivo:
		socio.estado_administrativo = EstadoAdministrativo.objects.get_or_create(
			nombre=ESTADO_ADMINISTRATIVO_INACTIVO,
		)[0]
		socio.save(update_fields=["estado_administrativo"])

	if con_jugador:
		estado_deportivo = EstadoDeportivo.objects.get_or_create(
			nombre=ESTADO_DEPORTIVO_INACTIVO if jugador_inactivo else "Activo",
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
	return Socio.objects.get(pk=socio.pk)


def crear_cuota_con_cargo(cuenta, periodo, monto, estado=EstadoCuotaChoices.EN_FECHA):
	cuota = Cuota.objects.create(
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
	MovimientoCuenta.objects.create(
		cuenta_corriente=cuenta,
		cuota=cuota,
		tipo_movimiento="Cargo",
		fecha="2026-09-01T12:00:00Z",
		monto=Decimal(monto),
		concepto=f"Cuota {periodo}",
	)
	return cuota


class GeneradorItemsCuotaTests(TestCase):
	def conceptos(self, socio):
		return [item.concepto for item in GeneradorItemsCuota(socio, date(2026, 10, 1)).build_items()]

	def test_socio_activo_solo_genera_item_social(self):
		self.assertEqual(self.conceptos(crear_socio("20000001")), ["CuotaSocial"])

	def test_socio_y_jugador_activos_generan_social_y_deportivo(self):
		socio = crear_socio("20000002", con_jugador=True)

		self.assertEqual(self.conceptos(socio), ["CuotaSocial", "CuotaDeportiva"])

	def test_jugador_dado_de_baja_solo_genera_item_social(self):
		socio = crear_socio("20000003", con_jugador=True, jugador_inactivo=True)

		self.assertEqual(self.conceptos(socio), ["CuotaSocial"])

	def test_socio_dado_de_baja_no_genera_items(self):
		socio = crear_socio("20000004", socio_inactivo=True, con_jugador=True)

		self.assertEqual(self.conceptos(socio), [])


class GeneracionCuotasMensualesTests(TestCase):
	def test_generacion_respeta_estado_de_socio_y_jugador(self):
		socio_activo = crear_socio("10000001")
		jugador_de_baja = crear_socio("10000002", con_jugador=True, jugador_inactivo=True)
		jugador_activo = crear_socio("10000003", con_jugador=True)
		socio_de_baja = crear_socio("10000004", socio_inactivo=True, con_jugador=True)

		resultado = generar_cuotas_mensuales(date(2026, 10, 5))

		self.assertEqual(resultado["cuotas_creadas"], 3)
		self.assertEqual(resultado["items_sociales"], 3)
		self.assertEqual(resultado["items_deportivos"], 1)
		esperados = {
			socio_activo: ["CuotaSocial"],
			jugador_de_baja: ["CuotaSocial"],
			jugador_activo: ["CuotaSocial", "CuotaDeportiva"],
		}
		for socio, conceptos in esperados.items():
			cuota = Cuota.objects.get(movimiento__cuenta_corriente__socio=socio, periodo="2026-10")
			self.assertEqual(sorted(cuota.items.values_list("concepto", flat=True)), sorted(conceptos))
		self.assertFalse(Cuota.objects.filter(movimiento__cuenta_corriente__socio=socio_de_baja).exists())

	def test_jugador_activo_generacion_repetida_no_duplica(self):
		socio = crear_socio("10000011", con_jugador=True)

		primer_resultado = generar_cuotas_mensuales(date(2026, 10, 1))
		segundo_resultado = generar_cuotas_mensuales(date(2026, 10, 31))

		cuenta = CuentaCorriente.objects.get(socio=socio)
		cuota = Cuota.objects.get(movimiento__cuenta_corriente=cuenta, periodo="2026-10")
		self.assertEqual(primer_resultado["cuotas_creadas"], 1)
		self.assertEqual(primer_resultado["items_deportivos"], 1)
		self.assertEqual(segundo_resultado["cuotas_creadas"], 0)
		self.assertEqual(segundo_resultado["cuotas_existentes"], 1)
		self.assertEqual(cuenta.cuotas.count(), 1)
		self.assertEqual(cuota.items.count(), 2)
		self.assertEqual(cuota.movimiento.tipo_movimiento, "Cargo")
		self.assertEqual(cuota.movimiento.monto, Decimal("2500.00"))
		self.assertEqual(cuenta.saldo, Decimal("-2500.00"))

	def test_endpoint_manual_ejecuta_generacion(self):
		crear_socio("10000012")
		self.client.force_login(get_user_model().objects.create_user(username="tesorero"))

		response = self.client.post(reverse("generar-cuotas-mensuales"))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["cuotas_creadas"], 1)
		self.assertEqual(response.data["items_sociales"], 1)


class CuotaEndpointTests(APITestCase):
	def setUp(self):
		self.client.force_authenticate(user=get_user_model().objects.create_user(username="tesorero"))
		self.socio = crear_socio("30000001", con_jugador=True)

	def crear(self, periodo="2026-10", socio=None):
		return self.client.post(
			reverse("cuota-list"),
			{"socio_id": (socio or self.socio).pk, "periodo": periodo},
			format="json",
		)

	def test_alta_arma_items_con_el_generador_y_registra_cargo(self):
		response = self.crear()

		self.assertEqual(response.status_code, 201, response.data)
		self.assertEqual(response.data["socio"]["socio_id"], self.socio.pk)
		self.assertEqual(response.data["fecha_venc1"], "2026-10-10")
		self.assertEqual(response.data["fecha_venc2"], "2026-10-20")
		self.assertEqual(Decimal(str(response.data["monto_total"])), Decimal("2500.00"))
		cuota = Cuota.objects.get(pk=response.data["cuota_id"])
		self.assertEqual(cuota.movimiento.monto, Decimal("2500.00"))
		self.assertEqual(CuentaCorriente.objects.get(socio=self.socio).saldo, Decimal("-2500.00"))

	def test_no_permite_dos_cuotas_del_mismo_periodo(self):
		self.crear()

		response = self.crear()

		self.assertEqual(response.status_code, 400)
		self.assertEqual(Cuota.objects.filter(periodo="2026-10").count(), 1)

	def test_no_genera_cuota_para_socio_dado_de_baja(self):
		socio = crear_socio("30000002", socio_inactivo=True)

		response = self.crear(socio=socio)

		self.assertEqual(response.status_code, 400)
		self.assertFalse(Cuota.objects.exists())

	def test_periodo_con_formato_invalido(self):
		response = self.crear(periodo="octubre")

		self.assertEqual(response.status_code, 400)
		self.assertIn("periodo", response.data)

	def test_edicion_solo_modifica_vencimientos(self):
		cuota_id = self.crear().data["cuota_id"]

		response = self.client.patch(
			reverse("cuota-detail", args=[cuota_id]),
			{"fecha_venc1": "2026-10-12", "fecha_venc2": "2026-10-25", "periodo": "2027-01"},
			format="json",
		)

		self.assertEqual(response.status_code, 200, response.data)
		cuota = Cuota.objects.get(pk=cuota_id)
		self.assertEqual(cuota.fecha_venc1, date(2026, 10, 12))
		self.assertEqual(cuota.periodo, "2026-10")

	def test_segundo_vencimiento_no_puede_ser_anterior(self):
		cuota_id = self.crear().data["cuota_id"]

		response = self.client.patch(
			reverse("cuota-detail", args=[cuota_id]),
			{"fecha_venc2": "2026-10-01"},
			format="json",
		)

		self.assertEqual(response.status_code, 400)

	def test_eliminar_cuota_revierte_saldo_y_movimiento(self):
		cuota_id = self.crear().data["cuota_id"]

		response = self.client.delete(reverse("cuota-detail", args=[cuota_id]))

		self.assertEqual(response.status_code, 204)
		self.assertFalse(MovimientoCuenta.objects.filter(cuota_id=cuota_id).exists())
		self.assertEqual(CuentaCorriente.objects.get(socio=self.socio).saldo, Decimal("0.00"))

	def test_agregar_descuento_actualiza_cargo_y_saldo(self):
		cuota_id = self.crear().data["cuota_id"]

		response = self.client.post(
			reverse("item-cuota-list"),
			{
				"cuota": cuota_id,
				"concepto": "DescuentoUnico",
				"es_descuento": True,
				"fecha_aplicacion": "2026-10-01",
				"monto": "500.00",
				"motivo": "Hermanos",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 201, response.data)
		self.assertEqual(MovimientoCuenta.objects.get(cuota_id=cuota_id).monto, Decimal("2000.00"))
		self.assertEqual(CuentaCorriente.objects.get(socio=self.socio).saldo, Decimal("-2000.00"))

		self.client.delete(reverse("item-cuota-detail", args=[response.data["item_cuota_id"]]))

		self.assertEqual(MovimientoCuenta.objects.get(cuota_id=cuota_id).monto, Decimal("2500.00"))
		self.assertEqual(CuentaCorriente.objects.get(socio=self.socio).saldo, Decimal("-2500.00"))

	def test_estado_de_cuenta_lista_cuotas_por_movimientos(self):
		self.crear()

		response = self.client.get(reverse("estado-cuenta-socio", args=[self.socio.pk]))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["cuotas_generadas"], 1)
		self.assertEqual(response.data["cuotas"][0]["periodo"], "2026-10")


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
		self.cuota_original = crear_cuota_con_cargo(self.cuenta, "Original", "100.00", EstadoCuotaChoices.PAGA)
		self.cuota_corregida = crear_cuota_con_cargo(self.cuenta, "Corregida", "50.00")

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
			numero=next_receipt_number(),
			monto_total=Decimal("100.00"),
		)
		self.movimiento_original = MovimientoCuenta.objects.create(
			cuenta_corriente=self.cuenta,
			pago=self.pago_original,
			tipo_movimiento="Abono",
			fecha="2026-09-30T12:00:00Z",
			monto=Decimal("100.00"),
			concepto="Pago de cuotas",
		)

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
		reversion = MovimientoCuenta.objects.get(movimiento_revertido=self.movimiento_original)
		self.assertEqual(reversion.tipo_movimiento, "Cargo")
		self.assertIsNone(reversion.pago_id)
		self.assertEqual(
			MovimientoCuenta.objects.get(pago_id=response.data["pago"]["pago_id"]).tipo_movimiento,
			"Abono",
		)
		self.assertEqual(Cuota.objects.get(pk=self.cuota_corregida.pk).estado_cuota, EstadoCuotaChoices.PAGA)
		imputacion = Imputacion.objects.get(movimiento_origen__pago_id=response.data["pago"]["pago_id"])
		self.assertEqual(imputacion.movimiento_destino.cuota_id, self.cuota_corregida.pk)
		self.assertEqual(imputacion.monto_aplicado, Decimal("50.00"))

	def test_no_permite_borrar_pago_ni_comprobante_original(self):
		pago_response = self.client.delete(reverse("pago-detail", args=[self.pago_original.pk]))
		comprobante_response = self.client.delete(reverse("comprobante-detail", args=[self.comprobante_original.pk]))

		self.assertEqual(pago_response.status_code, 405)
		self.assertEqual(comprobante_response.status_code, 405)
		self.assertTrue(Pago.objects.filter(pk=self.pago_original.pk).exists())
		self.assertTrue(Comprobante.objects.filter(pk=self.comprobante_original.pk).exists())


class PagoTestBase(APITestCase):
	def setUp(self):
		self.client.force_authenticate(user=get_user_model().objects.create_user(username="tesorero"))
		persona = Persona.objects.create(nombre="Juan", apellido="Paz", dni="56789012")
		self.socio = Socio.objects.create(persona=persona)
		self.cuenta = CuentaCorriente.objects.create(socio=self.socio, saldo=Decimal("-2000.00"))
		self.septiembre = crear_cuota_con_cargo(self.cuenta, "2026-09", "1000.00")
		self.agosto = crear_cuota_con_cargo(self.cuenta, "2026-08", "1000.00")

	def pagar(self, cuotas, monto, **extra):
		datos = {
			"socio_id": self.socio.pk,
			"cuota_ids": [cuota.pk for cuota in cuotas],
			"monto_total": monto,
			"medios": [{"medio_de_pago": "Efectivo", "monto": monto}],
		}
		datos.update(extra)
		return self.client.post(reverse("registrar-pago"), datos, format="json")

	def aplicado(self, cuota):
		return sum(
			Imputacion.objects.filter(movimiento_destino__cuota=cuota).values_list("monto_aplicado", flat=True),
			Decimal("0.00"),
		)


class RegistroPagoTests(PagoTestBase):
	def test_pago_parcial_imputa_y_deja_la_cuota_pendiente(self):
		response = self.pagar([self.agosto], "400.00")

		self.assertEqual(response.status_code, 201, response.data)
		self.agosto.refresh_from_db()
		self.assertNotEqual(self.agosto.estado_cuota, EstadoCuotaChoices.PAGA)
		self.assertEqual(self.aplicado(self.agosto), Decimal("400.00"))
		self.cuenta.refresh_from_db()
		self.assertEqual(self.cuenta.saldo, Decimal("-1600.00"))

	def test_segundo_pago_no_puede_superar_el_saldo_pendiente(self):
		self.pagar([self.agosto], "400.00")

		excedido = self.pagar([self.agosto], "700.00")
		completo = self.pagar([self.agosto], "600.00")

		self.assertEqual(excedido.status_code, 400)
		self.assertEqual(completo.status_code, 201, completo.data)
		self.agosto.refresh_from_db()
		self.assertEqual(self.agosto.estado_cuota, EstadoCuotaChoices.PAGA)
		self.assertEqual(self.aplicado(self.agosto), Decimal("1000.00"))

	def test_imputa_primero_la_cuota_mas_antigua(self):
		response = self.pagar([self.septiembre, self.agosto], "1500.00")

		self.assertEqual(response.status_code, 201, response.data)
		self.agosto.refresh_from_db()
		self.septiembre.refresh_from_db()
		self.assertEqual(self.agosto.estado_cuota, EstadoCuotaChoices.PAGA)
		self.assertEqual(self.aplicado(self.agosto), Decimal("1000.00"))
		self.assertEqual(self.aplicado(self.septiembre), Decimal("500.00"))
		self.assertNotEqual(self.septiembre.estado_cuota, EstadoCuotaChoices.PAGA)

	def test_no_permite_pagar_una_cuota_saldada(self):
		self.pagar([self.agosto], "1000.00")

		response = self.pagar([self.agosto], "100.00")

		self.assertEqual(response.status_code, 400)
		self.assertEqual(Pago.objects.count(), 1)

	def test_no_permite_pagar_cuotas_de_otro_socio(self):
		otra_cuenta = CuentaCorriente.objects.create(
			socio=Socio.objects.create(persona=Persona.objects.create(nombre="Otro", apellido="Socio", dni="67890123")),
		)
		ajena = crear_cuota_con_cargo(otra_cuenta, "2026-08", "1000.00")

		response = self.pagar([ajena], "100.00")

		self.assertEqual(response.status_code, 400)
		self.assertFalse(Pago.objects.exists())

	def test_campos_obligatorios_devuelven_errores_por_campo(self):
		response = self.client.post(reverse("registrar-pago"), {}, format="json")

		self.assertEqual(response.status_code, 400)
		for campo in ("socio_id", "cuota_ids", "monto_total", "medios"):
			self.assertIn(campo, response.data)

	def test_suma_de_medios_debe_coincidir_con_el_total(self):
		response = self.pagar(
			[self.agosto],
			"500.00",
			medios=[{"medio_de_pago": "Efectivo", "monto": "300.00"}],
		)

		self.assertEqual(response.status_code, 400)
		self.assertIn("medios", response.data)
		self.assertFalse(Pago.objects.exists())

	def test_correccion_sobre_la_misma_cuota_ignora_el_pago_original(self):
		original = self.pagar([self.agosto], "1000.00")
		get_user_model().objects.create_user(username="root")

		response = self.client.post(
			reverse("corregir-pago", args=[original.data["pago"]["pago_id"]]),
			{
				"motivo": "Monto mal cargado",
				"cuota_ids": [self.agosto.pk],
				"monto_total": "800.00",
				"medios": [{"medio_de_pago": "Transferencia", "monto": "800.00"}],
			},
			format="json",
		)

		self.assertEqual(response.status_code, 201, response.data)
		self.agosto.refresh_from_db()
		self.assertNotEqual(self.agosto.estado_cuota, EstadoCuotaChoices.PAGA)
		activo = Imputacion.objects.filter(
			movimiento_destino__cuota=self.agosto,
			movimiento_origen__reversion__isnull=True,
		)
		self.assertEqual(sum(activo.values_list("monto_aplicado", flat=True)), Decimal("800.00"))


class EstadoCuentaPendienteTests(PagoTestBase):
	def test_estado_de_cuenta_refleja_pagos_parciales(self):
		self.pagar([self.agosto], "400.00")

		response = self.client.get(reverse("estado-cuenta-socio", args=[self.socio.pk]))

		self.assertEqual(response.status_code, 200)
		cuotas = {cuota["periodo"]: cuota for cuota in response.data["cuotas"]}
		self.assertEqual(Decimal(str(cuotas["2026-08"]["monto_pagado"])), Decimal("400.00"))
		self.assertEqual(Decimal(str(cuotas["2026-08"]["saldo_pendiente"])), Decimal("600.00"))
		self.assertEqual(Decimal(str(cuotas["2026-09"]["saldo_pendiente"])), Decimal("1000.00"))
		self.assertEqual(Decimal(str(response.data["total_pagado"])), Decimal("400.00"))
		self.assertEqual(Decimal(str(response.data["total_adeudado"])), Decimal("1600.00"))

	def test_estado_de_cuenta_incluye_datos_del_socio(self):
		response = self.client.get(reverse("estado-cuenta-socio", args=[self.socio.pk]))

		self.assertEqual(response.data["socio"]["socio_id"], self.socio.pk)
		self.assertEqual(response.data["socio"]["dni"], "56789012")
		self.assertEqual(response.data["socio"]["apellido"], "Paz")

	def test_listado_de_cuotas_informa_saldo_pendiente(self):
		self.pagar([self.agosto], "250.00")

		response = self.client.get(reverse("cuota-list"))

		cuotas = {cuota["cuota_id"]: cuota for cuota in response.data}
		self.assertEqual(Decimal(str(cuotas[self.agosto.pk]["saldo_pendiente"])), Decimal("750.00"))
		self.assertEqual(Decimal(str(cuotas[self.agosto.pk]["monto_pagado"])), Decimal("250.00"))


class NumeracionComprobanteTests(APITestCase):
	def setUp(self):
		self.client.force_authenticate(user=get_user_model().objects.create_user(username="tesorero"))
		persona = Persona.objects.create(nombre="Luis", apellido="Gomez", dni="23456789")
		self.socio = Socio.objects.create(persona=persona)
		self.cuenta = CuentaCorriente.objects.create(socio=self.socio)
		self.cuotas = [crear_cuota_con_cargo(self.cuenta, f"2026-0{mes}", "100.00") for mes in (8, 9)]

	def registrar_pago(self, cuota):
		return self.client.post(
			reverse("registrar-pago"),
			{
				"socio_id": self.socio.pk,
				"cuota_ids": [cuota.pk],
				"monto_total": "100.00",
				"medios": [{"medio_de_pago": "Efectivo", "monto": "100.00"}],
			},
			format="json",
		)

	def test_numeracion_continua_desde_ultimo_numero(self):
		SecuenciaComprobante.objects.update_or_create(pk=1, defaults={"ultimo_numero": 41})

		self.assertEqual(next_receipt_number(), 42)
		self.assertEqual(next_receipt_number(), 43)

	def test_pagos_consecutivos_generan_numeros_correlativos(self):
		primero = self.registrar_pago(self.cuotas[0])
		segundo = self.registrar_pago(self.cuotas[1])

		self.assertEqual(primero.status_code, 201, primero.data)
		self.assertEqual(segundo.status_code, 201, segundo.data)
		self.assertEqual(
			segundo.data["comprobante"]["numero"],
			primero.data["comprobante"]["numero"] + 1,
		)
		self.assertEqual(
			SecuenciaComprobante.objects.get(pk=1).ultimo_numero,
			segundo.data["comprobante"]["numero"],
		)


class MovimientoCuotaMigrationTests(TransactionTestCase):
	migrate_from = [("finanzas", "0011_movimiento_cuota_schema")]
	migrate_to = [("finanzas", "0013_remove_cuota_cuenta_corriente")]

	def migrate(self, targets):
		executor = MigrationExecutor(connection)
		executor.loader.build_graph()
		executor.migrate(targets)
		return executor.loader.project_state(targets).apps

	def tearDown(self):
		self.migrate(MigrationExecutor(connection).loader.graph.leaf_nodes())

	def test_vincula_cuotas_y_reversiones_a_movimientos(self):
		old_apps = self.migrate(self.migrate_from)
		OldCuota = old_apps.get_model("finanzas", "Cuota")
		OldItemCuota = old_apps.get_model("finanzas", "ItemCuota")
		OldPago = old_apps.get_model("finanzas", "Pago")
		OldMovimiento = old_apps.get_model("finanzas", "MovimientoCuenta")

		persona = Persona.objects.create(nombre="Ana", apellido="Ruiz", dni="45678901")
		cuenta = CuentaCorriente.objects.create(socio=Socio.objects.create(persona=persona))
		cuota = OldCuota.objects.create(
			cuenta_corriente_id=cuenta.pk,
			fecha_venc1=date(2026, 8, 10),
			fecha_venc2=date(2026, 8, 20),
			periodo="2026-08",
		)
		OldItemCuota.objects.create(cuota=cuota, concepto="CuotaSocial", fecha_aplicacion=date(2026, 8, 1), monto=Decimal("1000.00"))
		OldItemCuota.objects.create(cuota=cuota, concepto="Beca", es_descuento=True, fecha_aplicacion=date(2026, 8, 1), monto=Decimal("200.00"))
		pago = OldPago.objects.create(fecha=date(2026, 8, 5))
		abono = OldMovimiento.objects.create(
			cuenta_corriente_id=cuenta.pk, pago=pago, tipo_movimiento="Abono",
			fecha="2026-08-05T12:00:00Z", monto=Decimal("800.00"),
		)
		reversion = OldMovimiento.objects.create(
			cuenta_corriente_id=cuenta.pk, pago=pago, tipo_movimiento="Cargo",
			fecha="2026-08-06T12:00:00Z", monto=Decimal("800.00"),
		)

		self.migrate(self.migrate_to)

		cargo = MovimientoCuenta.objects.get(cuota_id=cuota.pk)
		self.assertEqual(cargo.tipo_movimiento, "Cargo")
		self.assertEqual(cargo.monto, Decimal("800.00"))
		self.assertEqual(cargo.cuenta_corriente_id, cuenta.pk)
		self.assertEqual(Cuota.objects.get(pk=cuota.pk).fecha_creacion.date(), date(2026, 8, 1))
		reversion = MovimientoCuenta.objects.get(pk=reversion.pk)
		self.assertIsNone(reversion.pago_id)
		self.assertEqual(reversion.movimiento_revertido_id, abono.pk)
		self.assertEqual(MovimientoCuenta.objects.get(pk=abono.pk).pago_id, pago.pk)
