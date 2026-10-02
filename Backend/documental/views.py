from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .models import Documento, TipoDocumento, EstadoDocumento
from .serializers import DocumentoSerializer, TipoDocumentoSerializer, EstadoDocumentoSerializer

@extend_schema(tags=["Documental / Documentos"], request=DocumentoSerializer, responses=DocumentoSerializer)
@api_view(["GET", "POST"])
def documento_list_create(request):
    if request.method == "GET":
        persona_id = request.query_params.get('persona_id')
        if persona_id:
            documentos = Documento.objects.filter(persona_id=persona_id)
        else:
            documentos = Documento.objects.all()
        serializer = DocumentoSerializer(documentos, many=True)
        return Response(serializer.data)
    elif request.method == "POST":
        serializer = DocumentoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("SERIALIZER ERRORS:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(tags=["Documental / Documentos"], responses=DocumentoSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def documento_detail(request, pk):
    documento = get_object_or_404(Documento, pk=pk)
    if request.method == "GET":
        serializer = DocumentoSerializer(documento)
        return Response(serializer.data)
    elif request.method in ["PUT", "PATCH"]:
        serializer = DocumentoSerializer(documento, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == "DELETE":
        documento.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@extend_schema(tags=["Documental / Tipos"], request=TipoDocumentoSerializer, responses=TipoDocumentoSerializer)
@api_view(["GET"])
def tipo_documento_list(request):
    tipos = TipoDocumento.objects.all()
    serializer = TipoDocumentoSerializer(tipos, many=True)
    return Response(serializer.data)

@extend_schema(tags=["Documental / Estados"], request=EstadoDocumentoSerializer, responses=EstadoDocumentoSerializer)
@api_view(["GET"])
def estado_documento_list(request):
    estados = EstadoDocumento.objects.all()
    serializer = EstadoDocumentoSerializer(estados, many=True)
    return Response(serializer.data)

from django.utils import timezone
from datetime import timedelta

@extend_schema(tags=["Documental / Alertas"])
@api_view(["GET"])
def alertas_count(request):
    hoy = timezone.now().date()
    limite = hoy + timedelta(days=30)
    
    # Exclude those without vencimiento or already delivered
    # Assuming 'Vigente', 'Vencido', 'Pendiente', 'Entregado'
    # Actually just check dates on any document that has a date.
    documentos = Documento.objects.exclude(fecha_vencimiento__isnull=True)
    
    vencidos = 0
    proximos = 0
    
    for doc in documentos:
        vencimiento = doc.fecha_vencimiento.date()
        dias = (vencimiento - hoy).days
        if dias < 0:
            vencidos += 1
        elif dias <= 30:
            proximos += 1

    return Response({
        "vencidos": vencidos,
        "proximos": proximos
    })
