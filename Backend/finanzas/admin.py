from django.contrib import admin

from .models import (
	Comprobante,
	CuentaCorriente,
	Cuota,
	Imputacion,
	ItemPago,
	ItemCuota,
	MovimientoCuenta,
	Pago,
)

admin.site.register(Cuota)
admin.site.register(ItemCuota)
admin.site.register(Pago)
admin.site.register(Comprobante)
admin.site.register(CuentaCorriente)
admin.site.register(MovimientoCuenta)
admin.site.register(Imputacion)
admin.site.register(ItemPago)
