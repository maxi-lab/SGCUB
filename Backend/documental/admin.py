from django.contrib import admin
from .models import Documento, TipoDocumento, EstadoDocumento

admin.site.register(Documento)
admin.site.register(TipoDocumento)
admin.site.register(EstadoDocumento)