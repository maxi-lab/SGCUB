from django.db import models


class EstadoCuota(models.Model):
	class Valores(models.TextChoices):
		EN_FECHA = "En Fecha", "En Fecha"
		VENCIDA = "Vencida", "Vencida"
		PAGA = "Paga", "Paga"

	estado_cuota_id = models.AutoField(primary_key=True)
	nombre = models.CharField(max_length=40, choices=Valores.choices)

	class Meta:
		db_table = "estado_cuota"

	def __str__(self):
		return self.nombre


class Cuota(models.Model):
	cuota_id = models.AutoField(primary_key=True)
	estado_cuota = models.ForeignKey(
		EstadoCuota,
		on_delete=models.PROTECT,
		related_name="cuotas",
	)
	cuenta_corriente = models.ForeignKey(
		"finanzas.CuentaCorriente",
		on_delete=models.PROTECT,
		related_name="cuotas",
	)
	fecha_venc1 = models.DateField()
	fecha_venc2 = models.DateField()
	periodo = models.CharField(max_length=20)

	class Meta:
		db_table = "cuota"

	def __str__(self):
		return f"{self.cuenta_corriente} - {self.periodo}"


class ItemCuota(models.Model):
	class Conceptos(models.TextChoices):
		CUOTA_SOCIAL = "CuotaSocial", "CuotaSocial"
		CUOTA_DEPORTIVA = "CuotaDeportiva", "CuotaDeportiva"
		MORA = "Mora", "Mora"
		DESCUENTO_UNICO = "DescuentoUnico", "DescuentoUnico"
		BECA = "Beca", "Beca"
		OTRO = "Otro", "Otro"

	item_cuota_id = models.AutoField(primary_key=True)
	cuota = models.ForeignKey(
		Cuota,
		on_delete=models.CASCADE,
		related_name="items",
	)
	concepto = models.CharField(max_length=50, choices=Conceptos.choices)
	es_descuento = models.BooleanField()
	fecha_aplicacion = models.DateField()
	monto = models.DecimalField(max_digits=10, decimal_places=2)
	motivo = models.CharField(max_length=200)

	class Meta:
		db_table = "item_cuota"


class Pago(models.Model):
	pago_id = models.AutoField(primary_key=True)
	fecha = models.DateField()
	observacion = models.CharField(max_length=200, blank=True)

	class Meta:
		db_table = "pago"

	def __str__(self):
		return f"Pago {self.pago_id} - {self.fecha}"


class DetalleMedioPago(models.Model):
	medio_pago_id = models.AutoField(primary_key=True)
	pago = models.ForeignKey(
		Pago,
		on_delete=models.CASCADE,
		related_name="medios_de_pago",
	)
	medio_de_pago = models.CharField(max_length=50)
	monto = models.DecimalField(max_digits=10, decimal_places=2)

	class Meta:
		db_table = "detalle_medio_pago"


class Comprobante(models.Model):
	comprobante_id = models.AutoField(primary_key=True)
	pago = models.OneToOneField(
		Pago,
		on_delete=models.CASCADE,
		related_name="comprobante",
	)
	fecha_emision = models.DateField()
	numero = models.IntegerField(unique=True)
	monto_total = models.DecimalField(max_digits=10, decimal_places=2)

	class Meta:
		db_table = "comprobante"


class CuotaXPago(models.Model):
	cuota_pago_id = models.AutoField(primary_key=True)
	pago = models.ForeignKey(
		Pago,
		on_delete=models.CASCADE,
		related_name="cuotas_pagadas",
	)
	cuota = models.ForeignKey(
		Cuota,
		on_delete=models.PROTECT,
		related_name="pagos",
	)

	class Meta:
		db_table = "cuota_x_pago"
		constraints = [
			models.UniqueConstraint(
				fields=["pago", "cuota"],
				name="cuota_pago_unico",
			)
		]


class CuentaCorriente(models.Model):
	cuenta_corriente_id = models.AutoField(primary_key=True)
	socio = models.OneToOneField(
		"padron.Socio",
		on_delete=models.CASCADE,
		related_name="cuenta_corriente",
	)
	saldo = models.FloatField()

	class Meta:
		db_table = "cuenta_corriente"

	def __str__(self):
		return f"Cuenta corriente de {self.socio}"
