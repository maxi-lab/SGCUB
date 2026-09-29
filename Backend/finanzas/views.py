from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Max, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .models import (
	Comprobante,
	CuentaCorriente,
	Cuota,
	EstadoCuotaChoices,
	Imputacion,
	ItemPago,
	ItemCuota,
	MedioDePagoChoices,
	MovimientoCuenta,
	Pago,
)
from .serializers import (
	ComprobanteSerializer,
	CuentaCorrienteSerializer,
	CuotaSerializer,
	ImputacionSerializer,
	ItemPagoSerializer,
	ItemCuotaSerializer,
	MovimientoCuentaSerializer,
	PagoSerializer,
	CuentaCorrienteEstadoSerializer,
)


def _list_create(request, model, serializer_class, queryset=None):
	if request.method == "GET":
		objects = queryset if queryset is not None else model.objects.all()
		return Response(serializer_class(objects, many=True).data)

	serializer = serializer_class(data=request.data)
	if serializer.is_valid():
		return Response(
			serializer_class(serializer.save()).data,
			status=status.HTTP_201_CREATED,
		)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _detail(request, model, serializer_class, pk, queryset=None):
	objects = queryset if queryset is not None else model.objects.all()
	instance = get_object_or_404(objects, pk=pk)

	if request.method == "GET":
		return Response(serializer_class(instance).data)

	if request.method in ("PUT", "PATCH"):
		serializer = serializer_class(
			instance,
			data=request.data,
			partial=request.method == "PATCH",
		)
		if serializer.is_valid():
			return Response(serializer_class(serializer.save()).data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	instance.delete()
	return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Finanzas/EstadoCuota"])
@api_view(["GET", "POST"])
def estado_cuota_list_create(request):
	return Response([
		{"estado_cuota_id": value, "nombre": label}
		for value, label in EstadoCuotaChoices.choices
	])


@extend_schema(tags=["Finanzas/Cuota"], request=CuotaSerializer, responses=CuotaSerializer)
@api_view(["GET", "POST"])
def cuota_list_create(request):
	return _list_create(
		request,
		Cuota,
		CuotaSerializer,
		Cuota.objects.select_related("cuenta_corriente"),
	)


@extend_schema(tags=["Finanzas/Cuota"], request=CuotaSerializer, responses=CuotaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def cuota_detail(request, pk):
	return _detail(
		request,
		Cuota,
		CuotaSerializer,
		pk,
		Cuota.objects.select_related("cuenta_corriente"),
	)


@extend_schema(tags=["Finanzas/ItemCuota"], request=ItemCuotaSerializer, responses=ItemCuotaSerializer)
@api_view(["GET", "POST"])
def item_cuota_list_create(request):
	return _list_create(request, ItemCuota, ItemCuotaSerializer)


@extend_schema(tags=["Finanzas/ItemCuota"], request=ItemCuotaSerializer, responses=ItemCuotaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def item_cuota_detail(request, pk):
	return _detail(request, ItemCuota, ItemCuotaSerializer, pk)


@extend_schema(tags=["Finanzas/Pago"], request=PagoSerializer, responses=PagoSerializer)
@api_view(["GET", "POST"])
def pago_list_create(request):
	return _list_create(request, Pago, PagoSerializer)


@extend_schema(tags=["Finanzas/Pago"], request=PagoSerializer, responses=PagoSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def pago_detail(request, pk):
	return _detail(request, Pago, PagoSerializer, pk)


@extend_schema(tags=["Finanzas/Pago"], request=None, responses=ComprobanteSerializer)
@api_view(["POST"])
def registrar_pago(request):
	data = request.data
	cuota_ids = data.get("cuota_ids", [])
	medios = data.get("medios", [])

	if not isinstance(cuota_ids, list) or not cuota_ids:
		return Response({"detail": "Debe seleccionar al menos una cuota."}, status=status.HTTP_400_BAD_REQUEST)
	if not isinstance(medios, list) or not medios:
		return Response({"detail": "Debe informar al menos un medio de pago."}, status=status.HTTP_400_BAD_REQUEST)

	try:
		monto_total = Decimal(str(data.get("monto_total"))).quantize(Decimal("0.01"))
		montos = [Decimal(str(medio.get("monto"))).quantize(Decimal("0.01")) for medio in medios]
	except (InvalidOperation, TypeError, AttributeError):
		return Response({"detail": "Los importes deben ser números válidos."}, status=status.HTTP_400_BAD_REQUEST)

	if monto_total <= 0 or any(monto <= 0 for monto in montos):
		return Response({"detail": "Los importes deben ser mayores a cero."}, status=status.HTTP_400_BAD_REQUEST)
	if sum(montos, Decimal("0.00")) != monto_total:
		return Response({"detail": "La suma de los medios no coincide con el monto total."}, status=status.HTTP_400_BAD_REQUEST)

	medios_validos = {value for value, _ in MedioDePagoChoices.choices}
	if any(medio.get("medio_de_pago") not in medios_validos for medio in medios):
		return Response({"detail": "El medio de pago informado no es válido."}, status=status.HTTP_400_BAD_REQUEST)

	with transaction.atomic():
		cuenta = get_object_or_404(
			CuentaCorriente.objects.select_for_update().prefetch_related(
				Prefetch("cuotas", queryset=Cuota.objects.select_for_update().prefetch_related("items"))
			),
			socio_id=data.get("socio_id"),
		)
		cuotas = list(cuenta.cuotas.filter(cuota_id__in=cuota_ids))
		if len(cuotas) != len(set(cuota_ids)):
			return Response({"detail": "Una o más cuotas no pertenecen a este socio."}, status=status.HTTP_400_BAD_REQUEST)
		if any(cuota.estado_cuota == EstadoCuotaChoices.PAGA for cuota in cuotas):
			return Response({"detail": "No se pueden pagar cuotas ya saldadas."}, status=status.HTTP_400_BAD_REQUEST)

		monto_cuotas = sum(
			(sum((-item.monto if item.es_descuento else item.monto) for item in cuota.items.all()))
			for cuota in cuotas
		)
		if monto_total > monto_cuotas:
			return Response({"detail": "El pago supera el saldo de las cuotas seleccionadas."}, status=status.HTTP_400_BAD_REQUEST)

		pago = Pago.objects.create(
			usuario=request.user if request.user.is_authenticated else None,
			estado_pago="Acreditado",
			fecha=timezone.localdate(),
			observacion=data.get("observacion", ""),
		)
		for medio, monto in zip(medios, montos):
			ItemPago.objects.create(pago=pago, medio_de_pago=medio["medio_de_pago"], monto=monto)

		ultimo_numero = Comprobante.objects.select_for_update().aggregate(max_num=Max("numero"))["max_num"] or 0
		comprobante = Comprobante.objects.create(
			pago=pago,
			fecha_emision=timezone.localdate(),
			numero=ultimo_numero + 1,
			monto_total=monto_total,
		)
		MovimientoCuenta.objects.create(
			cuenta_corriente=cuenta,
			pago=pago,
			tipo_movimiento="Abono",
			fecha=timezone.now(),
			monto=monto_total,
			concepto="Pago de cuotas",
		)
		cuenta.saldo += monto_total
		cuenta.save(update_fields=["saldo"])

		restante = monto_total
		for cuota in cuotas:
			monto_cuota = sum((-item.monto if item.es_descuento else item.monto) for item in cuota.items.all())
			if restante >= monto_cuota:
				cuota.estado_cuota = EstadoCuotaChoices.PAGA
				cuota.save(update_fields=["estado_cuota"])
				restante -= monto_cuota

	return Response({
		"pago": PagoSerializer(pago).data,
		"comprobante": ComprobanteSerializer(comprobante).data,
	}, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Finanzas/ItemPago"], request=ItemPagoSerializer, responses=ItemPagoSerializer)
@api_view(["GET", "POST"])
def item_pago_list_create(request):
	return _list_create(request, ItemPago, ItemPagoSerializer)


@extend_schema(tags=["Finanzas/ItemPago"], request=ItemPagoSerializer, responses=ItemPagoSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def item_pago_detail(request, pk):
	return _detail(request, ItemPago, ItemPagoSerializer, pk)


@extend_schema(tags=["Finanzas/Comprobante"], request=ComprobanteSerializer, responses=ComprobanteSerializer)
@api_view(["GET", "POST"])
def comprobante_list_create(request):
	return _list_create(request, Comprobante, ComprobanteSerializer)


@extend_schema(tags=["Finanzas/Comprobante"], request=ComprobanteSerializer, responses=ComprobanteSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def comprobante_detail(request, pk):
	return _detail(request, Comprobante, ComprobanteSerializer, pk)





@extend_schema(tags=["Finanzas/CuentaCorriente"], request=CuentaCorrienteSerializer, responses=CuentaCorrienteSerializer)
@api_view(["GET", "POST"])
def cuenta_corriente_list_create(request):
	return _list_create(
		request,
		CuentaCorriente,
		CuentaCorrienteSerializer,
		CuentaCorriente.objects.select_related("socio"),
	)


@extend_schema(tags=["Finanzas/CuentaCorriente"], request=CuentaCorrienteSerializer, responses=CuentaCorrienteSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def cuenta_corriente_detail(request, pk):
	return _detail(
		request,
		CuentaCorriente,
		CuentaCorrienteSerializer,
		pk,
		CuentaCorriente.objects.select_related("socio"),
	)


@extend_schema(tags=["Finanzas/EstadoCuenta"], responses=CuentaCorrienteEstadoSerializer)
@api_view(["GET"])
def estado_cuenta_socio(request, socio_id):
	cuenta = get_object_or_404(
		CuentaCorriente.objects.prefetch_related(
			Prefetch("cuotas", queryset=Cuota.objects.prefetch_related("items"))
		),
		socio_id=socio_id,
	)
	return Response(CuentaCorrienteEstadoSerializer(cuenta).data)


@extend_schema(tags=["Finanzas/MovimientoCuenta"], request=MovimientoCuentaSerializer, responses=MovimientoCuentaSerializer)
@api_view(["GET", "POST"])
def movimiento_cuenta_list_create(request):
	return _list_create(request, MovimientoCuenta, MovimientoCuentaSerializer)


@extend_schema(tags=["Finanzas/MovimientoCuenta"], request=MovimientoCuentaSerializer, responses=MovimientoCuentaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def movimiento_cuenta_detail(request, pk):
	return _detail(request, MovimientoCuenta, MovimientoCuentaSerializer, pk)


@extend_schema(tags=["Finanzas/Imputacion"], request=ImputacionSerializer, responses=ImputacionSerializer)
@api_view(["GET", "POST"])
def imputacion_list_create(request):
	return _list_create(request, Imputacion, ImputacionSerializer)


@extend_schema(tags=["Finanzas/Imputacion"], request=ImputacionSerializer, responses=ImputacionSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def imputacion_detail(request, pk):
	return _detail(request, Imputacion, ImputacionSerializer, pk)
