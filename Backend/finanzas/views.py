from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from padron.models import Socio

from .models import (
	Beca,
	Comprobante,
	ConfiguracionFinanciera,
	CuentaCorriente,
	Cuota,
	EstadoCuotaChoices,
	Imputacion,
	ItemPago,
	ItemCuota,
	MovimientoCuenta,
	Pago,
)
from .receipts import receipt_filename, render_receipt_pdf
from .serializers import (
	BecaSerializer,
	BeneficioSerializer,
	ConfiguracionFinancieraSerializer,
	CorreccionPagoSerializer,
	ComprobanteSerializer,
	CuentaCorrienteSerializer,
	CuotaCreateSerializer,
	CuotaSerializer,
	CuotaUpdateSerializer,
	RegistroPagoSerializer,
	ImputacionSerializer,
	ItemPagoSerializer,
	ItemCuotaSerializer,
	MovimientoCuentaSerializer,
	PagoSerializer,
	CuentaCorrienteEstadoSerializer,
	ComprobanteDetalleSerializer,
)
from .services import (
	BeneficioInvalidoError,
	ComprobanteInvalidoError,
	CuotaConPagosError,
	CuotaDuplicadaError,
	PagoInvalidoError,
	SocioInactivoError,
	apply_surcharges,
	assign_benefit,
	correct_payment,
	create_cuota,
	delete_cuota,
	ensure_cuota_without_payments,
	generar_cuotas_mensuales,
	pending_amounts,
	register_payment,
	sync_cuota_charge,
)


def _cuota_con_pagos(error):
	return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)


def _cuotas_queryset():
	return Cuota.objects.select_related(
		"movimiento__cuenta_corriente__socio__persona",
	).prefetch_related("items")


@extend_schema(tags=["Finanzas/Cuota"], request=CuotaCreateSerializer, responses=CuotaSerializer)
@api_view(["GET", "POST"])
def cuota_list_create(request):
	if request.method == "GET":
		cuotas = list(_cuotas_queryset().order_by("pk"))
		return Response(CuotaSerializer(cuotas, many=True, context={"pending": pending_amounts(cuotas)}).data)

	serializer = CuotaCreateSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	data = serializer.validated_data
	socio = get_object_or_404(
		Socio.objects.select_related("estado_administrativo", "jugador__estado"),
		pk=data["socio_id"],
	)
	try:
		cuota = create_cuota(socio, data["periodo"], data.get("fecha_venc1"), data.get("fecha_venc2"))
	except (CuotaDuplicadaError, SocioInactivoError) as error:
		return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
	return Response(CuotaSerializer(_cuotas_queryset().get(pk=cuota.pk)).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Finanzas/Cuota"])
@api_view(["POST"])
def generar_cuotas_mensuales_manual(request):
	return Response(generar_cuotas_mensuales(), status=status.HTTP_200_OK)


@extend_schema(tags=["Finanzas/Cuota"])
@api_view(["POST"])
def aplicar_recargos_manual(request):
	return Response(apply_surcharges(), status=status.HTTP_200_OK)


@extend_schema(tags=["Finanzas/Cuota"], request=CuotaUpdateSerializer, responses=CuotaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def cuota_detail(request, pk):
	cuota = get_object_or_404(_cuotas_queryset(), pk=pk)
	if request.method == "GET":
		return Response(CuotaSerializer(cuota).data)

	try:
		if request.method == "DELETE":
			delete_cuota(cuota)
			return Response(status=status.HTTP_204_NO_CONTENT)
		ensure_cuota_without_payments(cuota)
	except CuotaConPagosError as error:
		return _cuota_con_pagos(error)

	serializer = CuotaUpdateSerializer(cuota, data=request.data, partial=request.method == "PATCH")
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	serializer.save()
	return Response(CuotaSerializer(_cuotas_queryset().get(pk=pk)).data)


@extend_schema(tags=["Finanzas/ItemCuota"], request=ItemCuotaSerializer, responses=ItemCuotaSerializer)
@api_view(["GET", "POST"])
def item_cuota_list_create(request):
	if request.method == "GET":
		return Response(ItemCuotaSerializer(ItemCuota.objects.all(), many=True).data)

	serializer = ItemCuotaSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	try:
		with transaction.atomic():
			ensure_cuota_without_payments(serializer.validated_data["cuota"])
			item = serializer.save()
			sync_cuota_charge(item.cuota)
	except CuotaConPagosError as error:
		return _cuota_con_pagos(error)
	return Response(ItemCuotaSerializer(item).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Finanzas/ItemCuota"], request=ItemCuotaSerializer, responses=ItemCuotaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def item_cuota_detail(request, pk):
	item = get_object_or_404(ItemCuota.objects.select_related("cuota"), pk=pk)
	if request.method == "GET":
		return Response(ItemCuotaSerializer(item).data)

	previous_cuota = item.cuota
	try:
		with transaction.atomic():
			ensure_cuota_without_payments(previous_cuota)
			if request.method == "DELETE":
				item.delete()
				sync_cuota_charge(previous_cuota)
				return Response(status=status.HTTP_204_NO_CONTENT)

			serializer = ItemCuotaSerializer(item, data=request.data, partial=request.method == "PATCH")
			if not serializer.is_valid():
				return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
			ensure_cuota_without_payments(serializer.validated_data.get("cuota", previous_cuota))
			item = serializer.save()
			sync_cuota_charge(previous_cuota)
			if item.cuota_id != previous_cuota.pk:
				sync_cuota_charge(item.cuota)
	except CuotaConPagosError as error:
		return _cuota_con_pagos(error)
	return Response(ItemCuotaSerializer(item).data)


@extend_schema(tags=["Finanzas/Pago"], responses=PagoSerializer)
@api_view(["GET"])
def pago_list(request):
	return Response(PagoSerializer(Pago.objects.order_by("pk"), many=True).data)


@extend_schema(tags=["Finanzas/Pago"], responses=PagoSerializer)
@api_view(["GET"])
def pago_detail(request, pk):
	pago = get_object_or_404(Pago, pk=pk)
	return Response(PagoSerializer(pago).data)


@extend_schema(tags=["Finanzas/Pago"], request=CorreccionPagoSerializer)
@api_view(["POST"])
def corregir_pago(request, pk):
	serializer = CorreccionPagoSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	data = serializer.validated_data
	try:
		pago_original, comprobante_original, pago, comprobante = correct_payment(
			pk,
			data["cuota_ids"],
			data["medios"],
			data["monto_total"],
			data["motivo"],
			request.user if request.user.is_authenticated else None,
		)
	except Pago.DoesNotExist:
		return Response({"detail": "El pago no existe."}, status=status.HTTP_404_NOT_FOUND)
	except (PagoInvalidoError, ComprobanteInvalidoError) as error:
		return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

	return Response({
		"pago_original": PagoSerializer(pago_original).data,
		"pago": PagoSerializer(pago).data,
		"comprobante_original": ComprobanteSerializer(comprobante_original).data,
		"comprobante": ComprobanteSerializer(comprobante).data,
		"motivo": data["motivo"],
		"usuario": request.user.get_username() if request.user.is_authenticated else None,
		"fecha": timezone.localtime().isoformat(),
	}, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Finanzas/Pago"], request=RegistroPagoSerializer, responses=ComprobanteSerializer)
@api_view(["POST"])
def registrar_pago(request):
	serializer = RegistroPagoSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	data = serializer.validated_data
	try:
		pago, comprobante = register_payment(
			data["socio_id"],
			data["cuota_ids"],
			data["medios"],
			data["monto_total"],
			data["observacion"],
			request.user if request.user.is_authenticated else None,
		)
	except CuentaCorriente.DoesNotExist:
		return Response({"detail": "El socio no tiene cuenta corriente."}, status=status.HTTP_404_NOT_FOUND)
	except (PagoInvalidoError, ComprobanteInvalidoError) as error:
		return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

	return Response({
		"pago": PagoSerializer(pago).data,
		"comprobante": ComprobanteSerializer(comprobante).data,
	}, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Finanzas/ItemPago"], responses=ItemPagoSerializer)
@api_view(["GET"])
def item_pago_list(request):
	return Response(ItemPagoSerializer(ItemPago.objects.order_by("pk"), many=True).data)


@extend_schema(tags=["Finanzas/ItemPago"], responses=ItemPagoSerializer)
@api_view(["GET"])
def item_pago_detail(request, pk):
	return Response(ItemPagoSerializer(get_object_or_404(ItemPago, pk=pk)).data)


@extend_schema(tags=["Finanzas/Comprobante"], responses=ComprobanteSerializer)
@api_view(["GET"])
def comprobante_list(request):
	return Response(ComprobanteSerializer(Comprobante.objects.order_by("pk"), many=True).data)


@extend_schema(tags=["Finanzas/Comprobante"], responses=ComprobanteDetalleSerializer)
@api_view(["GET"])
def comprobante_detail(request, pk):
	comprobante = get_object_or_404(
		Comprobante.objects.select_related(
			"pago__movimiento__cuenta_corriente__socio__persona",
			"reemplazado_por",
			"reemplaza_a",
		).prefetch_related("pago__items_pago"),
		pk=pk,
	)
	return Response(ComprobanteDetalleSerializer(comprobante).data)


@extend_schema(tags=["Finanzas/Comprobante"], responses={(200, "application/pdf"): bytes})
@api_view(["GET"])
def comprobante_pdf(request, pk):
	comprobante = get_object_or_404(
		Comprobante.objects.select_related(
			"pago__movimiento__cuenta_corriente__socio__persona",
			"reemplazado_por",
		),
		pk=pk,
	)
	response = HttpResponse(render_receipt_pdf(comprobante), content_type="application/pdf")
	response["Content-Disposition"] = f'attachment; filename="{receipt_filename(comprobante)}"'
	return response


@extend_schema(tags=["Finanzas/CuentaCorriente"], request=CuentaCorrienteSerializer, responses=CuentaCorrienteSerializer)
@api_view(["GET", "POST"])
def cuenta_corriente_list_create(request):
	if request.method == "GET":
		cuentas = CuentaCorriente.objects.select_related("socio").order_by("pk")
		return Response(CuentaCorrienteSerializer(cuentas, many=True).data)

	serializer = CuentaCorrienteSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	return Response(CuentaCorrienteSerializer(serializer.save()).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Finanzas/CuentaCorriente"], request=CuentaCorrienteSerializer, responses=CuentaCorrienteSerializer)
@api_view(["GET", "PUT", "PATCH"])
def cuenta_corriente_detail(request, pk):
	cuenta = get_object_or_404(CuentaCorriente.objects.select_related("socio"), pk=pk)
	if request.method == "GET":
		return Response(CuentaCorrienteSerializer(cuenta).data)

	serializer = CuentaCorrienteSerializer(cuenta, data=request.data, partial=request.method == "PATCH")
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	return Response(CuentaCorrienteSerializer(serializer.save()).data)


@extend_schema(tags=["Finanzas/EstadoCuenta"], responses=CuentaCorrienteEstadoSerializer)
@api_view(["GET"])
def estado_cuenta_socio(request, socio_id):
	cuenta = get_object_or_404(
		CuentaCorriente.objects.select_related("socio__persona"),
		socio_id=socio_id,
	)
	return Response(CuentaCorrienteEstadoSerializer(cuenta).data)


@extend_schema(tags=["Finanzas/Morosidad"])
@api_view(["GET"])
def reporte_morosidad(request):
	alcance = request.query_params.get("alcance", "activos").strip().lower()
	if alcance not in {"activos", "filtrados", "manual", "socio"}:
		return Response(
			{"detail": "El alcance debe ser activos, filtrados, manual o socio."},
			status=status.HTTP_400_BAD_REQUEST,
		)

	hoy = timezone.localdate()
	socios = Socio.objects.select_related(
		"persona",
		"estado_administrativo",
		"jugador__categoria",
		"cuenta_corriente",
	)

	if alcance == "activos":
		socios = socios.filter(estado_administrativo__nombre__iexact="Activo")
	elif alcance == "manual":
		ids_texto = request.query_params.get("socio_ids", "")
		try:
			socio_ids = [int(value) for value in ids_texto.split(",") if value]
		except ValueError:
			return Response({"detail": "La selección de socios no es válida."}, status=status.HTTP_400_BAD_REQUEST)
		if not socio_ids:
			return Response({"detail": "Debe seleccionar al menos un socio."}, status=status.HTTP_400_BAD_REQUEST)
		socios = socios.filter(socio_id__in=socio_ids)
	elif alcance == "socio":
		try:
			socio_id = int(request.query_params.get("socio_id", ""))
		except ValueError:
			return Response({"detail": "Debe indicar un socio válido."}, status=status.HTTP_400_BAD_REQUEST)
		socios = socios.filter(socio_id=socio_id)
	else:
		termino = request.query_params.get("q", "").strip()
		for palabra in termino.split():
			filtro = (
				Q(persona__nombre__icontains=palabra)
				| Q(persona__apellido__icontains=palabra)
				| Q(persona__dni__icontains=palabra)
			)
			if palabra.isdigit():
				filtro |= Q(numero_socio=int(palabra))
			socios = socios.filter(filtro)

		categoria = request.query_params.get("categoria", "").strip()
		if categoria and categoria.lower() == "sin categoría":
			socios = socios.filter(jugador__isnull=True)
		elif categoria:
			socios = socios.filter(jugador__categoria__nombre__iexact=categoria)

	objetivos = list(socios.order_by("persona__apellido", "persona__nombre"))
	cuotas_vencidas_objetivos = list(
		Cuota.objects.filter(
			movimiento__cuenta_corriente__socio__in=[socio.pk for socio in objetivos],
			fecha_venc1__lt=hoy,
		)
		.exclude(estado_cuota=EstadoCuotaChoices.PAGA)
		.select_related("movimiento")
	)
	pendiente = pending_amounts(cuotas_vencidas_objetivos)
	cuotas_por_cuenta = {}
	for cuota in cuotas_vencidas_objetivos:
		if pendiente[cuota.pk] > 0:
			cuotas_por_cuenta.setdefault(cuota.movimiento.cuenta_corriente_id, []).append(cuota)
	sin_cuenta = sum(1 for socio in objetivos if getattr(socio, "cuenta_corriente", None) is None)
	filas = []
	for socio in objetivos:
		cuenta = getattr(socio, "cuenta_corriente", None)
		if cuenta is None:
			continue

		cuotas_vencidas = cuotas_por_cuenta.get(cuenta.pk, [])
		if not cuotas_vencidas:
			continue
		monto_adeudado = sum((pendiente[cuota.pk] for cuota in cuotas_vencidas), Decimal("0.00"))

		jugador = getattr(socio, "jugador", None)
		categoria_deportiva = jugador.categoria.nombre if jugador else "Sin categoría"
		filas.append({
			"socio_id": socio.socio_id,
			"numero_socio": socio.numero_socio,
			"nombre": socio.persona.nombre,
			"apellido": socio.persona.apellido,
			"dni": socio.persona.dni,
			"categoria_deportiva": categoria_deportiva,
			"monto_adeudado": monto_adeudado,
			"cuotas_vencidas": len(cuotas_vencidas),
			"dias_mora": max((hoy - cuota.fecha_venc1).days for cuota in cuotas_vencidas),
		})

	return Response({
		"filas": filas,
		"fecha": timezone.localtime().strftime("%d/%m/%Y %H:%M"),
		"alcance": {
			"activos": "Socios activos",
			"filtrados": "Filtros aplicados",
			"manual": "Selección manual",
			"socio": "Socio individual",
		}[alcance],
		"sin_cuenta": sin_cuenta,
	})


@extend_schema(tags=["Finanzas/MovimientoCuenta"], responses=MovimientoCuentaSerializer)
@api_view(["GET"])
def movimiento_cuenta_list(request):
	return Response(MovimientoCuentaSerializer(MovimientoCuenta.objects.order_by("pk"), many=True).data)


@extend_schema(tags=["Finanzas/MovimientoCuenta"], responses=MovimientoCuentaSerializer)
@api_view(["GET"])
def movimiento_cuenta_detail(request, pk):
	return Response(MovimientoCuentaSerializer(get_object_or_404(MovimientoCuenta, pk=pk)).data)


@extend_schema(tags=["Finanzas/Imputacion"], responses=ImputacionSerializer)
@api_view(["GET"])
def imputacion_list(request):
	return Response(ImputacionSerializer(Imputacion.objects.order_by("pk"), many=True).data)


@extend_schema(tags=["Finanzas/Imputacion"], responses=ImputacionSerializer)
@api_view(["GET"])
def imputacion_detail(request, pk):
	return Response(ImputacionSerializer(get_object_or_404(Imputacion, pk=pk)).data)


@extend_schema(tags=["Finanzas/Configuracion"], request=ConfiguracionFinancieraSerializer, responses=ConfiguracionFinancieraSerializer)
@api_view(["GET", "PUT", "PATCH"])
def configuracion_financiera(request):
	configuracion = ConfiguracionFinanciera.load()
	if request.method == "GET":
		return Response(ConfiguracionFinancieraSerializer(configuracion).data)

	serializer = ConfiguracionFinancieraSerializer(configuracion, data=request.data, partial=request.method == "PATCH")
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	usuario = request.user if request.user.is_authenticated else None
	return Response(ConfiguracionFinancieraSerializer(serializer.save(usuario_actualizacion=usuario)).data)


@extend_schema(tags=["Finanzas/Beca"], request=BeneficioSerializer)
@api_view(["POST"])
def cuota_beneficio(request, pk):
	cuota = get_object_or_404(Cuota.objects.filter(movimiento__isnull=False), pk=pk)
	serializer = BeneficioSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	data = serializer.validated_data
	try:
		beca, item = assign_benefit(
			cuota.pk,
			data["tipo"],
			data["modalidad"],
			data["valor"],
			data["concepto"],
			data["fecha_aplicacion"],
			data["motivo"],
			data.get("fecha_fin"),
			request.user if request.user.is_authenticated else None,
		)
	except (BeneficioInvalidoError, CuotaConPagosError) as error:
		return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

	return Response({
		"beca": BecaSerializer(beca).data if beca else None,
		"item": ItemCuotaSerializer(item).data if item else None,
		"aplicado_a_cuota": item is not None,
	}, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Finanzas/Beca"], responses=BecaSerializer)
@api_view(["GET"])
def beca_list(request):
	becas = Beca.objects.order_by("-fecha_aplicacion", "-pk")
	socio_id = request.query_params.get("socio_id")
	if socio_id:
		if not socio_id.isdigit():
			return Response({"detail": "El socio indicado no es válido."}, status=status.HTTP_400_BAD_REQUEST)
		becas = becas.filter(socio_id=int(socio_id))
	return Response(BecaSerializer(becas, many=True).data)
