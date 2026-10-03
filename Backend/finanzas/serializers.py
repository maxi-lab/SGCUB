from decimal import Decimal

from rest_framework import serializers

from .models import (
    Comprobante,
    CuentaCorriente,
    Cuota,
    Imputacion,
    ItemPago,
    ItemCuota,
    MovimientoCuenta,
    Pago,
    EstadoCuotaChoices,
    MedioDePagoChoices,
)
from .services import net_amount, parse_period, pending_amounts


def monto_total_cuota(cuota):
    return net_amount(cuota.items.all())


def socio_data(socio):
    return {
        "socio_id": socio.socio_id,
        "numero_socio": socio.numero_socio,
        "nombre": socio.persona.nombre,
        "apellido": socio.persona.apellido,
        "dni": socio.persona.dni,
    }


def cuota_account(cuota):
    movement = getattr(cuota, "movimiento", None)
    return movement.cuenta_corriente if movement else None


class MedioPagoSerializer(serializers.Serializer):
    medio_de_pago = serializers.ChoiceField(choices=MedioDePagoChoices.choices)
    monto = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )


class CorreccionPagoSerializer(serializers.Serializer):
    motivo = serializers.CharField(max_length=150, allow_blank=False, trim_whitespace=True)
    cuota_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    monto_total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    medios = MedioPagoSerializer(many=True, allow_empty=False)

    def validate_cuota_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("No se deben repetir cuotas.")
        return value

    def validate(self, attrs):
        total_medios = sum((medio["monto"] for medio in attrs["medios"]), start=0)
        if total_medios != attrs["monto_total"]:
            raise serializers.ValidationError({
                "medios": "La suma de los medios debe coincidir con el monto total."
            })
        return attrs


class RegistroPagoSerializer(serializers.Serializer):
    socio_id = serializers.IntegerField(min_value=1)
    cuota_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    monto_total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    medios = MedioPagoSerializer(many=True, allow_empty=False)
    observacion = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")

    def validate_cuota_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("No se deben repetir cuotas.")
        return value

    def validate(self, attrs):
        total_medios = sum((medio["monto"] for medio in attrs["medios"]), Decimal("0.00"))
        if total_medios != attrs["monto_total"]:
            raise serializers.ValidationError({
                "medios": "La suma de los medios debe coincidir con el monto total."
            })
        return attrs


class CuotaSerializer(serializers.ModelSerializer):
    cuenta_corriente = serializers.SerializerMethodField()
    socio = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    monto_total = serializers.SerializerMethodField()
    monto_pagado = serializers.SerializerMethodField()
    saldo_pendiente = serializers.SerializerMethodField()

    class Meta:
        model = Cuota
        fields = [
            "cuota_id",
            "cuenta_corriente",
            "socio",
            "estado_cuota",
            "fecha_creacion",
            "fecha_venc1",
            "fecha_venc2",
            "periodo",
            "items",
            "monto_total",
            "monto_pagado",
            "saldo_pendiente",
        ]
        read_only_fields = fields

    def get_cuenta_corriente(self, obj):
        account = cuota_account(obj)
        return account.cuenta_corriente_id if account else None

    def get_socio(self, obj):
        account = cuota_account(obj)
        return socio_data(account.socio) if account else None

    def get_items(self, obj):
        return ItemCuotaSerializer(obj.items.all(), many=True).data

    def get_monto_total(self, obj):
        return monto_total_cuota(obj)

    def get_monto_pagado(self, obj):
        return monto_total_cuota(obj) - self._pending(obj)

    def get_saldo_pendiente(self, obj):
        return self._pending(obj)

    def _pending(self, obj):
        pending = self.context.get("pending")
        if pending is not None and obj.pk in pending:
            return pending[obj.pk]
        if getattr(obj, "movimiento", None) is None:
            return monto_total_cuota(obj)
        return pending_amounts([obj])[obj.pk]


def validate_due_dates(attrs, instance=None):
    first = attrs.get("fecha_venc1", getattr(instance, "fecha_venc1", None))
    second = attrs.get("fecha_venc2", getattr(instance, "fecha_venc2", None))
    if first and second and second < first:
        raise serializers.ValidationError({
            "fecha_venc2": "El segundo vencimiento no puede ser anterior al primero."
        })
    return attrs


class CuotaCreateSerializer(serializers.Serializer):
    socio_id = serializers.IntegerField(min_value=1)
    periodo = serializers.CharField(max_length=20)
    fecha_venc1 = serializers.DateField(required=False)
    fecha_venc2 = serializers.DateField(required=False)

    def validate_periodo(self, value):
        try:
            parse_period(value)
        except ValueError as error:
            raise serializers.ValidationError(str(error))
        return value

    def validate(self, attrs):
        return validate_due_dates(attrs)


class CuotaUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuota
        fields = ["fecha_venc1", "fecha_venc2"]

    def validate(self, attrs):
        return validate_due_dates(attrs, self.instance)


class ItemCuotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCuota
        fields = "__all__"
        read_only_fields = ["item_cuota_id"]


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = "__all__"
        read_only_fields = ["pago_id"]


class ItemPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemPago
        fields = "__all__"
        read_only_fields = ["id_item_pago"]


class ComprobanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comprobante
        fields = "__all__"
        read_only_fields = ["comprobante_id"]


class ComprobanteDetalleSerializer(ComprobanteSerializer):
    pago_detalle = serializers.SerializerMethodField()

    class Meta(ComprobanteSerializer.Meta):
        fields = [
            "comprobante_id",
            "pago",
            "fecha_emision",
            "numero",
            "monto_total",
            "pago_detalle",
        ]
        read_only_fields = ["comprobante_id"]

    def get_pago_detalle(self, obj):
        pago = obj.pago
        detalle = PagoSerializer(pago).data
        detalle["items_pago"] = ItemPagoSerializer(pago.items_pago.all(), many=True).data
        movimiento = getattr(pago, "movimiento", None)
        detalle["socio"] = socio_data(movimiento.cuenta_corriente.socio) if movimiento else None
        return detalle




class CuentaCorrienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaCorriente
        fields = "__all__"
        read_only_fields = ["cuenta_corriente_id", "saldo"]

    def validate_socio(self, value):
        if self.instance is not None and value != self.instance.socio:
            raise serializers.ValidationError("No se puede cambiar el socio de una cuenta corriente.")
        return value


class CuentaCorrienteEstadoSerializer(serializers.ModelSerializer):
    socio = serializers.SerializerMethodField()
    cuotas = serializers.SerializerMethodField()
    cuotas_generadas = serializers.SerializerMethodField()
    cuotas_pagas = serializers.SerializerMethodField()
    cuotas_impagas = serializers.SerializerMethodField()
    total_adeudado = serializers.SerializerMethodField()
    total_mora = serializers.SerializerMethodField()

    class Meta:
        model = CuentaCorriente
        fields = [
            "cuenta_corriente_id",
            "socio",
            "saldo",
            "estado_cuenta_corriente",
            "cuotas",
            "cuotas_generadas",
            "cuotas_pagas",
            "cuotas_impagas",
            "total_pagado",
            "total_adeudado",
            "total_mora",
        ]

    total_pagado = serializers.SerializerMethodField()

    def _account_cuotas(self, obj):
        cache = self.__dict__.setdefault("_cuotas_cache", {})
        if obj.pk not in cache:
            cache[obj.pk] = list(
                obj.cuotas.select_related("movimiento__cuenta_corriente__socio__persona")
                .prefetch_related("items")
                .order_by("pk")
            )
        return cache[obj.pk]

    def _account_pending(self, obj):
        cache = self.__dict__.setdefault("_pending_cache", {})
        if obj.pk not in cache:
            cache[obj.pk] = pending_amounts(self._account_cuotas(obj))
        return cache[obj.pk]

    def get_socio(self, obj):
        return socio_data(obj.socio)

    def get_cuotas(self, obj):
        return CuotaSerializer(
            self._account_cuotas(obj),
            many=True,
            context={"pending": self._account_pending(obj)},
        ).data

    def get_cuotas_generadas(self, obj):
        return len(self._account_cuotas(obj))

    def get_cuotas_pagas(self, obj):
        return sum(1 for cuota in self._account_cuotas(obj) if cuota.estado_cuota == EstadoCuotaChoices.PAGA)

    def get_cuotas_impagas(self, obj):
        return sum(1 for cuota in self._account_cuotas(obj) if cuota.estado_cuota != EstadoCuotaChoices.PAGA)

    def get_total_pagado(self, obj):
        pending = self._account_pending(obj)
        return sum(
            (monto_total_cuota(cuota) - pending[cuota.pk] for cuota in self._account_cuotas(obj)),
            Decimal("0.00"),
        )

    def get_total_adeudado(self, obj):
        return sum(self._account_pending(obj).values(), Decimal("0.00"))

    def get_total_mora(self, obj):
        return sum(
            (
                item.monto
                for cuota in self._account_cuotas(obj)
                for item in cuota.items.all()
                if "mora" in item.concepto.lower()
            ),
            Decimal("0.00"),
        )


class MovimientoCuentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoCuenta
        fields = "__all__"
        read_only_fields = ["movimiento_cuenta_id"]


class ImputacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Imputacion
        fields = "__all__"
        read_only_fields = ["imputacion_id"]
