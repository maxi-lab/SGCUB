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
)




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




class CuentaCorrienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaCorriente
        fields = "__all__"
        read_only_fields = ["cuenta_corriente_id"]


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
