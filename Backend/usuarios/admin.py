from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .dni import normalize_dni, validate_dni

User = get_user_model()


class DniUsernameMixin:

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].label = "DNI"
        self.fields["username"].help_text = "Se usa para iniciar sesión. Solo números, entre 7 y 8 dígitos."

    def clean_username(self):
        dni = normalize_dni(self.cleaned_data.get("username"))
        validate_dni(dni)
        self.cleaned_data["username"] = dni
        parent_clean = getattr(super(), "clean_username", None)
        return parent_clean() if parent_clean else dni


class UsuarioCreationForm(DniUsernameMixin, UserCreationForm):
    pass


class UsuarioChangeForm(DniUsernameMixin, UserChangeForm):
    pass


admin.site.unregister(User)


@admin.register(User)
class UsuarioAdmin(UserAdmin):
    add_form = UsuarioCreationForm
    form = UsuarioChangeForm
