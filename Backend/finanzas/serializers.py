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


def monto_total_cuota(cuota):
    return sum(
        (-item.monto if item.es_descuento else item.monto)
        for item in cuota.items.all()
    )


class MedioCorreccionPagoSerializer(serializers.Serializer):
    medio_de_pago = serializers.ChoiceField(choices=MedioDePagoChoices.choices)
    monto = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)


class CorreccionPagoSerializer(serializers.Serializer):
    motivo = serializers.CharField(max_length=150, allow_blank=False, trim_whitespace=True)
    cuota_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    monto_total = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    medios = MedioCorreccionPagoSerializer(many=True, allow_empty=False)

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




class CuotaSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    monto_total = serializers.SerializerMethodField()

    class Meta:
        model = Cuota
        fields = [
            "cuota_id",
            "cuenta_corriente",
            "estado_cuota",
            "fecha_venc1",
            "fecha_venc2",
            "periodo",
            "items",
            "monto_total",
        ]
        read_only_fields = ["cuota_id"]

    def get_items(self, obj):
        return ItemCuotaSerializer(obj.items.all(), many=True).data

    def get_monto_total(self, obj):
        return monto_total_cuota(obj)


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
        movimiento = pago.movimientos.select_related("cuenta_corriente__socio__persona").first()
        if movimiento:
            socio = movimiento.cuenta_corriente.socio
            detalle["socio"] = {
                "socio_id": socio.socio_id,
                "numero_socio": socio.numero_socio,
                "nombre": socio.persona.nombre,
                "apellido": socio.persona.apellido,
                "dni": socio.persona.dni,
            }
        else:
            detalle["socio"] = None
        return detalle




class CuentaCorrienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaCorriente
        fields = "__all__"
        read_only_fields = ["cuenta_corriente_id"]


class CuentaCorrienteEstadoSerializer(serializers.ModelSerializer):
    cuotas = CuotaSerializer(many=True, read_only=True)
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
            "total_adeudado",
            "total_mora",
        ]

    def get_cuotas_generadas(self, obj):
        return obj.cuotas.count()

    def get_cuotas_pagas(self, obj):
        return obj.cuotas.filter(estado_cuota=EstadoCuotaChoices.PAGA).count()

    def get_cuotas_impagas(self, obj):
        return obj.cuotas.exclude(estado_cuota=EstadoCuotaChoices.PAGA).count()

    def get_total_adeudado(self, obj):
        return sum(
            monto_total_cuota(cuota)
            for cuota in obj.cuotas.all()
            if cuota.estado_cuota != EstadoCuotaChoices.PAGA
        )

    def get_total_mora(self, obj):
        return sum(
            item.monto
            for cuota in obj.cuotas.all()
            for item in cuota.items.all()
            if "mora" in item.concepto.lower()
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
