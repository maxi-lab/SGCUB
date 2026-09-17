from django.contrib import admin

from .models import (
	Comprobante,
	CuentaCorriente,
	Cuota,
	CuotaXPago,
	DetalleMedioPago,
	EstadoCuota,
	ItemCuota,
	Pago,
)

admin.site.register(EstadoCuota)
admin.site.register(Cuota)
admin.site.register(ItemCuota)
admin.site.register(Pago)
admin.site.register(DetalleMedioPago)
admin.site.register(Comprobante)
admin.site.register(CuotaXPago)
admin.site.register(CuentaCorriente)
