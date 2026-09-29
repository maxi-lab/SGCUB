from django.shortcuts import get_object_or_404
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
