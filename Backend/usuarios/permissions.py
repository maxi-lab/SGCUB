from rest_framework.permissions import BasePermission


def _has_user_permission(request, action):
    return bool(request.user and request.user.is_authenticated and request.user.has_perm(f"auth.{action}_user"))


class CanManageUsuarios(BasePermission):
    # Exige el permiso de Django sobre auth.User que corresponde a cada método HTTP.
    # La baja es lógica (is_active=False), por eso DELETE pide "change" y no "delete".
    ACTION_BY_METHOD = {"GET": "view", "POST": "add", "PATCH": "change", "DELETE": "change"}

    def has_permission(self, request, view):
        action = self.ACTION_BY_METHOD.get(request.method)
        return bool(action) and _has_user_permission(request, action)


class CanChangeUsuarios(BasePermission):
    # Para acciones puntuales sobre un usuario existente (reactivar, resetear contraseña)
    def has_permission(self, request, view):
        return _has_user_permission(request, "change")
