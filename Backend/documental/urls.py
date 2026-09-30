from django.urls import path
from .views import (
    documento_list_create,
    documento_detail,
    tipo_documento_list,
    estado_documento_list
)

urlpatterns = [
    path('documentos/', documento_list_create, name='documento-list'),
    path('documentos/<int:pk>/', documento_detail, name='documento-detail'),
    path('tipos/', tipo_documento_list, name='tipo-documento-list'),
    path('estados/', estado_documento_list, name='estado-documento-list'),
]
