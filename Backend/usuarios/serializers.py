from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class UsuarioActualSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    is_superuser = serializers.BooleanField()

    def get_full_name(self, user) -> str:
        return user.get_full_name() or user.username

    def get_roles(self, user) -> list[str]:
        return sorted(user.groups.values_list("name", flat=True))

    def get_permissions(self, user) -> list[str]:
        # Formato "<app_label>.<codename>", el mismo que usa ROLE_PERMISSIONS
        return sorted(user.get_all_permissions())


class CambioPasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context["request"].user)
        return value
