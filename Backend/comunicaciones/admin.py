from django.contrib import admin

from .models import EnvioNotificacion, Notificacion


admin.site.register(Notificacion)
admin.site.register(EnvioNotificacion)
