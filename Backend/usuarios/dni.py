import re

from django.core.exceptions import ValidationError

from padron.serializers import DNI_REGEX

def normalize_dni(value):
    return re.sub(r"[.\s]", "", value or "")

def validate_dni(value):
    if not DNI_REGEX.fullmatch(value or ""):
        raise ValidationError("El DNI debe ser numérico y tener entre 7 y 8 dígitos.")
