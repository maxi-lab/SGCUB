from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from padron.models import Socio

from .models import (
	Comprobante,
	CuentaCorriente,
	Cuota,
	EstadoPagoChoices,
	EstadoCuotaChoices,
	Imputacion,
	ItemPago,
	ItemCuota,
	MedioDePagoChoices,
	MovimientoCuenta,
	Pago,
	TipoMovimientoChoices,
)
from .serializers import (
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
	CuotaDuplicadaError,
	PagoInvalidoError,
	SocioInactivoError,
	apply_payment,
	create_cuota,
	delete_cuota,
	generar_cuotas_mensuales,
	lock_account_cuotas,
	next_receipt_number,
	pending_amounts,
	register_payment,
	sync_cuota_charge,
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


def _cuotas_queryset():
	return Cuota.objects.select_related(
		"movimiento__cuenta_corriente__socio__persona",
	).prefetch_related("items")


@extend_schema(tags=["Finanzas/EstadoCuota"])
@api_view(["GET", "POST"])
def estado_cuota_list_create(request):
	return Response([
		{"estado_cuota_id": value, "nombre": label}
		for value, label in EstadoCuotaChoices.choices
	])


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


@extend_schema(tags=["Finanzas/Cuota"], request=CuotaUpdateSerializer, responses=CuotaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def cuota_detail(request, pk):
	cuota = get_object_or_404(_cuotas_queryset(), pk=pk)
	if request.method == "GET":
		return Response(CuotaSerializer(cuota).data)

	if request.method == "DELETE":
		delete_cuota(cuota)
		return Response(status=status.HTTP_204_NO_CONTENT)

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

	with transaction.atomic():
		item = serializer.save()
		sync_cuota_charge(item.cuota)
	return Response(ItemCuotaSerializer(item).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Finanzas/ItemCuota"], request=ItemCuotaSerializer, responses=ItemCuotaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def item_cuota_detail(request, pk):
	item = get_object_or_404(ItemCuota.objects.select_related("cuota"), pk=pk)
	if request.method == "GET":
		return Response(ItemCuotaSerializer(item).data)

	previous_cuota = item.cuota
	with transaction.atomic():
		if request.method == "DELETE":
			item.delete()
			sync_cuota_charge(previous_cuota)
			return Response(status=status.HTTP_204_NO_CONTENT)

		serializer = ItemCuotaSerializer(item, data=request.data, partial=request.method == "PATCH")
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
		item = serializer.save()
		sync_cuota_charge(previous_cuota)
		if item.cuota_id != previous_cuota.pk:
			sync_cuota_charge(item.cuota)
	return Response(ItemCuotaSerializer(item).data)


@extend_schema(tags=["Finanzas/Pago"], request=PagoSerializer, responses=PagoSerializer)
@api_view(["GET", "POST"])
def pago_list_create(request):
	return _list_create(request, Pago, PagoSerializer)


@extend_schema(tags=["Finanzas/Pago"], request=PagoSerializer, responses=PagoSerializer)
@api_view(["GET"])
def pago_detail(request, pk):
	pago = get_object_or_404(Pago, pk=pk)
	return Response(PagoSerializer(pago).data)


@extend_schema(tags=["Finanzas/Pago"], request=CorreccionPagoSerializer)
@api_view(["POST"])
def corregir_pago(request, pk):
	

	data = request.data
	motivo = str(data.get("motivo", "")).strip()
	cuota_ids = data.get("cuota_ids", [])
	medios = data.get("medios", [])
	if not motivo:
		return Response({"detail": "El motivo de la corrección es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)
	if len(motivo) > 150:
		return Response({"detail": "El motivo no puede superar los 150 caracteres."}, status=status.HTTP_400_BAD_REQUEST)
	if not isinstance(cuota_ids, list) or not cuota_ids:
		return Response({"detail": "Debe seleccionar al menos una cuota."}, status=status.HTTP_400_BAD_REQUEST)
	if not isinstance(medios, list) or not medios:
		return Response({"detail": "Debe informar al menos un medio de pago."}, status=status.HTTP_400_BAD_REQUEST)
	try:
		cuota_ids = [int(cuota_id) for cuota_id in cuota_ids]
		monto_total = Decimal(str(data.get("monto_total"))).quantize(Decimal("0.01"))
		montos = [Decimal(str(medio.get("monto"))).quantize(Decimal("0.01")) for medio in medios]
	except (InvalidOperation, TypeError, ValueError, AttributeError):
		return Response({"detail": "Los importes, cuotas y medios informados no son válidos."}, status=status.HTTP_400_BAD_REQUEST)
	if len(cuota_ids) != len(set(cuota_ids)):
		return Response({"detail": "No se deben repetir cuotas."}, status=status.HTTP_400_BAD_REQUEST)
	if monto_total <= 0 or any(monto <= 0 for monto in montos):
		return Response({"detail": "Los importes deben ser mayores a cero."}, status=status.HTTP_400_BAD_REQUEST)
	if sum(montos, Decimal("0.00")) != monto_total:
		return Response({"detail": "La suma de los medios no coincide con el monto total."}, status=status.HTTP_400_BAD_REQUEST)
	medios_validos = {value for value, _ in MedioDePagoChoices.choices}
	if any(medio.get("medio_de_pago") not in medios_validos for medio in medios):
		return Response({"detail": "El medio de pago informado no es válido."}, status=status.HTTP_400_BAD_REQUEST)

	usuario_root = get_user_model().objects.filter(username__iexact="root", is_active=True).first()
	if usuario_root is None:
		return Response({"detail": "No existe un usuario activo con nombre root para registrar la corrección."}, status=status.HTTP_400_BAD_REQUEST)

	with transaction.atomic():
		pago_original = get_object_or_404(
			Pago.objects.select_for_update(),
			pk=pk,
		)
		if pago_original.estado_pago != EstadoPagoChoices.ACREDITADO:
			return Response({"detail": "Solo se pueden corregir pagos acreditados."}, status=status.HTTP_400_BAD_REQUEST)
		comprobante_original = get_object_or_404(
			Comprobante.objects.select_for_update(),
			pago_id=pago_original.pk,
		)
		movimiento_original = MovimientoCuenta.objects.select_for_update().filter(
			pago_id=pago_original.pk,
		).first()
		if movimiento_original is None:
			return Response({"detail": "El pago original no tiene un movimiento de cuenta para revertir."}, status=status.HTTP_400_BAD_REQUEST)

		cuenta = CuentaCorriente.objects.select_for_update().get(
			pk=movimiento_original.cuenta_corriente_id
		)
		try:
			cuotas = lock_account_cuotas(cuenta, cuota_ids)
		except PagoInvalidoError:
			return Response({"detail": "Una o más cuotas no pertenecen al socio del pago original."}, status=status.HTTP_400_BAD_REQUEST)

		pendiente = pending_amounts(cuotas, ignored_origin=movimiento_original)
		if monto_total > sum(pendiente.values(), Decimal("0.00")):
			return Response({"detail": "El pago corregido supera el saldo pendiente de las cuotas seleccionadas."}, status=status.HTTP_400_BAD_REQUEST)

		pago_nuevo = Pago.objects.create(
			usuario=usuario_root,
			estado_pago=EstadoPagoChoices.ACREDITADO,
			fecha=timezone.localdate(),
			observacion=f"Sustituye al pago #{pago_original.pk}. Motivo: {motivo}"[:200],
		)
		for medio, monto in zip(medios, montos):
			ItemPago.objects.create(
				pago=pago_nuevo,
				medio_de_pago=medio["medio_de_pago"],
				monto=monto,
			)

		comprobante_nuevo = Comprobante.objects.create(
			pago=pago_nuevo,
			fecha_emision=timezone.localdate(),
			numero=next_receipt_number(),
			monto_total=monto_total,
		)

		monto_original = comprobante_original.monto_total
		MovimientoCuenta.objects.create(
			cuenta_corriente=cuenta,
			movimiento_revertido=movimiento_original,
			tipo_movimiento=TipoMovimientoChoices.CARGO,
			fecha=timezone.now(),
			monto=monto_original,
			concepto=f"Reversión del pago #{pago_original.pk}. Sustituido por #{pago_nuevo.pk}. Motivo: {motivo}"[:200],
		)
		movimiento_nuevo = MovimientoCuenta.objects.create(
			cuenta_corriente=cuenta,
			pago=pago_nuevo,
			tipo_movimiento=TipoMovimientoChoices.ABONO,
			fecha=timezone.now(),
			monto=monto_total,
			concepto=f"Pago corregido; sustituye al pago #{pago_original.pk}."[:200],
		)
		cuenta.saldo += monto_total - monto_original
		cuenta.save(update_fields=["saldo"])

		pago_original.estado_pago = EstadoPagoChoices.ANULADO
		pago_original.observacion = f"Anulado. Sustituido por pago #{pago_nuevo.pk}. Motivo: {motivo}"[:200]
		pago_original.save(update_fields=["estado_pago", "observacion"])

		apply_payment(movimiento_nuevo, cuotas, monto_total)

	return Response({
		"pago_original": PagoSerializer(pago_original).data,
		"pago": PagoSerializer(pago_nuevo).data,
		"comprobante_original": ComprobanteSerializer(comprobante_original).data,
		"comprobante": ComprobanteSerializer(comprobante_nuevo).data,
		"motivo": motivo,
		"usuario": usuario_root.get_username(),
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
	except PagoInvalidoError as error:
		return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

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
@api_view(["GET"])
def comprobante_detail(request, pk):
	comprobante = get_object_or_404(
		Comprobante.objects.select_related(
			"pago__movimiento__cuenta_corriente__socio__persona",
		).prefetch_related("pago__items_pago"),
		pk=pk,
	)
	return Response(ComprobanteDetalleSerializer(comprobante).data)





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
