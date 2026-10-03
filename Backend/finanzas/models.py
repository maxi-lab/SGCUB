from django.conf import settings
from django.db import models
from django.utils import timezone


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


class EstadoComprobanteChoices(models.TextChoices):
    VIGENTE = "Vigente", "Vigente"
    ANULADO = "Anulado", "Anulado"


class MedioDePagoChoices(models.TextChoices):
    EFECTIVO = "Efectivo", "Efectivo"
    TRANSFERENCIA = "Transferencia", "Transferencia"
    BILLETERA_VIRTUAL = "BilleteraVirtual", "Billetera Virtual"


class TipoMovimientoChoices(models.TextChoices):
    ABONO = "Abono", "Abono"
    CARGO = "Cargo", "Cargo"


class EstadoCuentaCorrienteChoices(models.TextChoices):
    ACTIVO = "Activo", "Activo"
    INACTIVO = "Inactivo", "Inactivo"


class Cuota(models.Model):
    cuota_id = models.AutoField(primary_key=True)
    estado_cuota = models.CharField(
        max_length=40,
        choices=EstadoCuotaChoices.choices,
        default=EstadoCuotaChoices.EN_FECHA,
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_venc1 = models.DateField()
    fecha_venc2 = models.DateField()
    periodo = models.CharField(max_length=20)

    class Meta:
        db_table = "cuota"

    def __str__(self):
        return f"Cuota {self.periodo}"


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
    motivo_anulacion = models.TextField(blank=True)

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
        on_delete=models.PROTECT,
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
        on_delete=models.PROTECT,
        related_name="comprobante",
    )
    fecha_emision = models.DateField()
    numero = models.IntegerField(unique=True)
    monto_total = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(
        max_length=20,
        choices=EstadoComprobanteChoices.choices,
        default=EstadoComprobanteChoices.VIGENTE,
    )
    reemplazado_por = models.OneToOneField(
        "self",
        on_delete=models.PROTECT,
        related_name="reemplaza_a",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "comprobante"

    def __str__(self):
        return f"Comprobante {self.numero}"


class SecuenciaComprobante(models.Model):
    secuencia_comprobante_id = models.AutoField(primary_key=True)
    ultimo_numero = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "secuencia_comprobante"

    def __str__(self):
        return f"Último comprobante {self.ultimo_numero}"


class CuentaCorriente(models.Model):
    cuenta_corriente_id = models.AutoField(primary_key=True)
    socio = models.OneToOneField(
        "padron.Socio",
        on_delete=models.PROTECT,
        related_name="cuenta_corriente",
    )
    saldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado_cuenta_corriente = models.CharField(
        max_length=40,
        choices=EstadoCuentaCorrienteChoices.choices,
        default=EstadoCuentaCorrienteChoices.ACTIVO,
    )

    class Meta:
        db_table = "cuenta_corriente"

    def __str__(self):
        return f"Cuenta corriente de {self.socio}"

    @property
    def cuotas(self):
        return Cuota.objects.filter(movimiento__cuenta_corriente=self)


class MovimientoCuenta(models.Model):
    movimiento_cuenta_id = models.AutoField(primary_key=True)
    cuenta_corriente = models.ForeignKey(
        CuentaCorriente,
        on_delete=models.PROTECT,
        related_name="movimientos",
    )
    pago = models.OneToOneField(
        Pago,
        on_delete=models.PROTECT,
        related_name="movimiento",
        null=True,
        blank=True,
    )
    cuota = models.OneToOneField(
        Cuota,
        on_delete=models.CASCADE,
        related_name="movimiento",
        null=True,
        blank=True,
    )
    movimiento_revertido = models.OneToOneField(
        "self",
        on_delete=models.PROTECT,
        related_name="reversion",
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
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(cuota__isnull=False, pago__isnull=True, movimiento_revertido__isnull=True)
                    | models.Q(cuota__isnull=True, pago__isnull=False, movimiento_revertido__isnull=True)
                    | models.Q(cuota__isnull=True, pago__isnull=True, movimiento_revertido__isnull=False)
                ),
                name="movimiento_cuenta_single_origin",
            ),
        ]

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.monto}"


class Imputacion(models.Model):
    imputacion_id = models.AutoField(primary_key=True)
    movimiento_origen = models.ForeignKey(
        MovimientoCuenta,
        on_delete=models.PROTECT,
        related_name="imputaciones_origen",
    )
    movimiento_destino = models.ForeignKey(
        MovimientoCuenta,
        on_delete=models.PROTECT,
        related_name="imputaciones_destino",
    )
    fecha = models.DateTimeField()
    monto_aplicado = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "imputacion"

    def __str__(self):
        return f"Imputación {self.imputacion_id}"

