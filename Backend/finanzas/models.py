from django.conf import settings
from django.db import models


class EstadoCuotaChoices(models.TextChoices):
    EN_FECHA = "EnFecha", "En Fecha"
    VENCIDA = "Vencida", "Vencida"
    PAGA = "Paga", "Paga"


class ConceptoItemChoices(models.TextChoices):
    CUOTA_SOCIAL = "CuotaSocial", "Cuota Social"
    CUOTA_DEPORTIVA = "CuotaDeportiva", "Cuota Deportiva"
    MORA = "Mora", "Mora"
    DESCUENTO_UNICO = "DescuentoUnico", "Descuento Unico"
    BECA = "Beca", "Beca"
    OTRO = "Otro", "Otro"


class EstadoPagoChoices(models.TextChoices):
    ACREDITADO = "Acreditado", "Acreditado"
    ANULADO = "Anulado", "Anulado"
    PENDIENTE_VERIFICACION = "PendienteVerificacion", "Pendiente de verificacion"


class MedioDePagoChoices(models.TextChoices):
    EFECTIVO = "Efectivo", "Efectivo"
    TRANSFERENCIA = "Transferencia", "Transferencia"
    BILLETERA_VIRTUAL = "BilleteraVirtual", "Billetera Virtual"


class TipoMovimientoChoices(models.TextChoices):
    ABONO = "Abono", "Abono"
    CARGO = "Cargo", "Cargo"


class Cuota(models.Model):
    cuota_id = models.AutoField(primary_key=True)
    cuenta_corriente = models.ForeignKey(
        "finanzas.CuentaCorriente",
        on_delete=models.PROTECT,
        related_name="cuotas",
    )
    estado_cuota = models.CharField(
        max_length=40,
        choices=EstadoCuotaChoices.choices,
        default=EstadoCuotaChoices.EN_FECHA,
    )
    fecha_venc1 = models.DateField()
    fecha_venc2 = models.DateField()
    periodo = models.CharField(max_length=20)

    class Meta:
        db_table = "cuota"

    def __str__(self):
        return f"{self.cuenta_corriente} - {self.periodo}"


class ItemCuota(models.Model):
    item_cuota_id = models.AutoField(primary_key=True)
    cuota = models.ForeignKey(
        Cuota,
        on_delete=models.CASCADE,
        related_name="items",
    )
    concepto = models.CharField(
        max_length=40,
        choices=ConceptoItemChoices.choices,
        default=ConceptoItemChoices.CUOTA_SOCIAL,
    )
    es_descuento = models.BooleanField(default=False)
    fecha_aplicacion = models.DateField()
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "item_cuota"

    def __str__(self):
        return f"{self.concepto} - {self.monto}"


class Pago(models.Model):
    pago_id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="pagos",
        null=True,
        blank=True,
    )
    estado_pago = models.CharField(
        max_length=40,
        choices=EstadoPagoChoices.choices,
        default=EstadoPagoChoices.ACREDITADO,
    )
    fecha = models.DateField()
    observacion = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "pago"

    def __str__(self):
        return f"Pago {self.pago_id} - {self.fecha}"


class ItemPago(models.Model):
    id_item_pago = models.AutoField(primary_key=True)
    medio_de_pago = models.CharField(
        max_length=40,
        choices=MedioDePagoChoices.choices,
    )
    pago = models.ForeignKey(
        Pago,
        on_delete=models.CASCADE,
        related_name="items_pago",
    )
    monto = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "item_pago"

    def __str__(self):
        return f"{self.medio_de_pago} - {self.monto}"


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

    def __str__(self):
        return f"Comprobante {self.numero}"


class CuentaCorriente(models.Model):
    cuenta_corriente_id = models.AutoField(primary_key=True)
    socio = models.OneToOneField(
        "padron.Socio",
        on_delete=models.CASCADE,
        related_name="cuenta_corriente",
    )
    saldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = "cuenta_corriente"

    def __str__(self):
        return f"Cuenta corriente de {self.socio}"


class MovimientoCuenta(models.Model):
    movimiento_cuenta_id = models.AutoField(primary_key=True)
    cuenta_corriente = models.ForeignKey(
        CuentaCorriente,
        on_delete=models.CASCADE,
        related_name="movimientos",
    )
    pago = models.ForeignKey(
        Pago,
        on_delete=models.SET_NULL,
        related_name="movimientos",
        null=True,
        blank=True,
    )
    tipo_movimiento = models.CharField(
        max_length=40,
        choices=TipoMovimientoChoices.choices,
        default=TipoMovimientoChoices.ABONO,
    )
    fecha = models.DateTimeField()
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    concepto = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "movimiento_cuenta"

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.monto}"


class Imputacion(models.Model):
    imputacion_id = models.AutoField(primary_key=True)
    movimiento_origen = models.ForeignKey(
        MovimientoCuenta,
        on_delete=models.CASCADE,
        related_name="imputaciones_origen",
    )
    movimiento_destino = models.ForeignKey(
        MovimientoCuenta,
        on_delete=models.CASCADE,
        related_name="imputaciones_destino",
    )
    fecha = models.DateTimeField()
    monto = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "imputacion"

    def __str__(self):
        return f"Imputación {self.imputacion_id}"

