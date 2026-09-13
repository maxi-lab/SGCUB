from rest_framework import serializers

from .models import (
    Comprobante,
    CuentaCorriente,
    Cuota,
    CuotaXPago,
    DetalleMedioPago,
    EstadoCuota,
    ItemCuota,
    Pago,
)


class EstadoCuotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoCuota
        fields = "__all__"
        read_only_fields = ["estado_cuota_id"]


class CuotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuota
        fields = "__all__"
        read_only_fields = ["cuota_id"]


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


class DetalleMedioPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleMedioPago
        fields = "__all__"
        read_only_fields = ["medio_pago_id"]


class ComprobanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comprobante
        fields = "__all__"
        read_only_fields = ["comprobante_id"]


class CuotaXPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuotaXPago
        fields = "__all__"
        read_only_fields = ["cuota_pago_id"]


class CuentaCorrienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaCorriente
        fields = "__all__"
        read_only_fields = ["cuenta_corriente_id"]
