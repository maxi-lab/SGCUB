from django.urls import path

from .views import (
    comprobante_detail,
    comprobante_list_create,
    cuenta_corriente_detail,
    cuenta_corriente_list_create,
    cuota_detail,
    cuota_list_create,
    cuota_x_pago_detail,
    cuota_x_pago_list_create,
    detalle_medio_pago_detail,
    detalle_medio_pago_list_create,
    estado_cuota_detail,
    estado_cuota_list_create,
    item_cuota_detail,
    item_cuota_list_create,
    pago_detail,
    pago_list_create,
)

urlpatterns = [
    path("estado-cuota/", estado_cuota_list_create, name="estado-cuota-list"),
    path("estado-cuota/<int:pk>/", estado_cuota_detail, name="estado-cuota-detail"),
    path("cuota/", cuota_list_create, name="cuota-list"),
    path("cuota/<int:pk>/", cuota_detail, name="cuota-detail"),
    path("item-cuota/", item_cuota_list_create, name="item-cuota-list"),
    path("item-cuota/<int:pk>/", item_cuota_detail, name="item-cuota-detail"),
    path("pago/", pago_list_create, name="pago-list"),
    path("pago/<int:pk>/", pago_detail, name="pago-detail"),
    path("detalle-medio-pago/", detalle_medio_pago_list_create, name="detalle-medio-pago-list"),
    path("detalle-medio-pago/<int:pk>/", detalle_medio_pago_detail, name="detalle-medio-pago-detail"),
    path("comprobante/", comprobante_list_create, name="comprobante-list"),
    path("comprobante/<int:pk>/", comprobante_detail, name="comprobante-detail"),
    path("cuota-x-pago/", cuota_x_pago_list_create, name="cuota-x-pago-list"),
    path("cuota-x-pago/<int:pk>/", cuota_x_pago_detail, name="cuota-x-pago-detail"),
    path("cuenta-corriente/", cuenta_corriente_list_create, name="cuenta-corriente-list"),
    path("cuenta-corriente/<int:pk>/", cuenta_corriente_detail, name="cuenta-corriente-detail"),
]