from django.contrib.auth.models import Group, Permission

ADMINISTRADOR = "Administrador"

# Cada rol es un grupo de Django que se sincriza despues de cada migración.
# Los permsisos modificados desde el panel de administracion de Django se sobreescribren en la sigueinte migración.
#Cualquier usuario autenticado puede operar el sistema. Estos permisos solo habilitan acciones especificas
ROLE_PERMISSIONS = {
    # ACA VAN LAS RESTRICCIONES PARA LOS ROLES
    # Format: "<app_label>.<codename>", e.g. "Directivo": ["finanzas.assign_beca"]
    "Administrativo": [],
    "Directivo": [],
    "Tesorero": [],
}


def _get_permission(code):
    app_label, codename = code.split(".")
    return Permission.objects.get(content_type__app_label=app_label, codename=codename)


def sync_roles():
    for name, codes in ROLE_PERMISSIONS.items():
        group, _ = Group.objects.get_or_create(name=name)
        group.permissions.set([_get_permission(code) for code in codes])

    #Administrador tiene permiso a todo
    administrador, _ = Group.objects.get_or_create(name=ADMINISTRADOR)
    administrador.permissions.set(Permission.objects.all())
