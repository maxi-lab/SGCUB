from django.utils import timezone
from .models import Documento, EstadoDocumento


def refresh_document_states():
    today = timezone.localdate()
    estados = {estado.nombre: estado for estado in EstadoDocumento.objects.filter(nombre__in=['Vigente', 'Vencido'])}
    if len(estados) < 2:
        return

    Documento.objects.filter(fecha_vencimiento__date__lt=today) \
        .exclude(estado_documento=estados['Vencido']) \
        .update(estado_documento=estados['Vencido'])
    Documento.objects.exclude(fecha_vencimiento__date__lt=today) \
        .exclude(estado_documento=estados['Vigente']) \
        .update(estado_documento=estados['Vigente'])
