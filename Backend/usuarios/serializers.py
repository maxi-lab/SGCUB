from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .dni import normalize_dni
from .dni import validate_dni as check_dni_format
from .roles import ADMINISTRADOR, ROLE_PERMISSIONS

User = get_user_model()


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        attrs[self.username_field] = normalize_dni(attrs.get(self.username_field))
        return super().validate(attrs)


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


ROLES = [*ROLE_PERMISSIONS, ADMINISTRADOR]


def _to_drf_error(validator, value):
    try:
        validator(value)
    except DjangoValidationError as error:
        raise serializers.ValidationError(error.messages)


class UsuarioSerializer(serializers.ModelSerializer):
    dni = serializers.CharField(source="username", max_length=12)
    full_name = serializers.SerializerMethodField()
    # Cada usuario tiene un único rol; en la lectura se agrega en to_representation
    role = serializers.ChoiceField(choices=ROLES, write_only=True)

    class Meta:
        model = User
        fields = [
            "id", "dni", "first_name", "last_name", "full_name", "email", "role",
            "is_active", "last_login", "date_joined",
        ]
        read_only_fields = ["is_active", "last_login", "date_joined"]
        extra_kwargs = {
            "first_name": {"required": True, "allow_blank": False},
            "last_name": {"required": True, "allow_blank": False},
            "email": {"required": True, "allow_blank": False},
        }

    def get_full_name(self, user) -> str:
        return user.get_full_name() or user.username

    def to_representation(self, user):
        data = super().to_representation(user)
        group = user.groups.first()
        data["role"] = group.name if group else None
        return data

    def _other_users(self):
        users = User.objects.all()
        return users.exclude(pk=self.instance.pk) if self.instance else users

    def validate_dni(self, value):
        dni = normalize_dni(value)
        _to_drf_error(check_dni_format, dni)
        if self._other_users().filter(username=dni).exists():
            raise serializers.ValidationError("Ya existe un usuario con este DNI.")
        return dni

    def validate_email(self, value):
        email = value.strip().lower()
        if self._other_users().filter(email__iexact=email).exists():
            raise serializers.ValidationError("Ya existe un usuario con este correo.")
        return email

    def validate_role(self, value):
        # Evita que un administrador se quite su propio acceso a esta pantalla
        request_user = self.context["request"].user
        is_self = self.instance is not None and self.instance.pk == request_user.pk
        if is_self and not self.instance.groups.filter(name=value).exists():
            raise serializers.ValidationError("No podés cambiar tu propio rol.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role")
        user = User(**validated_data)
        # La clave inicial es el DNI; el usuario la cambia después de ingresar
        user.set_password(user.username)
        user.save()
        user.groups.set([Group.objects.get(name=role)])
        return user

    def update(self, user, validated_data):
        role = validated_data.pop("role", None)
        user = super().update(user, validated_data)
        if role:
            user.groups.set([Group.objects.get(name=role)])
        return user
