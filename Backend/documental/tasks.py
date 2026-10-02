from django.utils import timezone
from .models import Documento, EstadoDocumento

def actualizar_estados_vencidos():
    hoy = timezone.now().date()
    estado_vencido = EstadoDocumento.objects.filter(nombre='Vencido').first()
    
    if not estado_vencido:
        return
        
    documentos_vencidos = Documento.objects.filter(
        fecha_vencimiento__date__lt=hoy
    ).exclude(estado_documento=estado_vencido)
    
    for doc in documentos_vencidos:
        doc.estado_documento = estado_vencido
        doc.save(update_fields=['estado_documento'])
