from rest_framework import serializers
from .models import Persona, Socio, Categoria, Jugador, Docente


class PersonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Persona
        fields = ["persona_id", "nombre", "apellido", "dni"]
        read_only_fields = ["persona_id"]


class SocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Socio
        fields = ["socio_id", "nombre", "apellido", "telefono"]
        read_only_fields = ["socio_id"]


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["categoria_id", "nombre"]
        read_only_fields = ["categoria_id"]


class JugadorSerializer(serializers.ModelSerializer):
    socio = serializers.PrimaryKeyRelatedField(queryset=Socio.objects.all())
    categoria = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all())

    class Meta:
        model = Jugador
        fields = ["jugador_id", "socio", "categoria"]
        read_only_fields = ["jugador_id"]


class DocenteSerializer(serializers.ModelSerializer):
    persona = serializers.PrimaryKeyRelatedField(queryset=Persona.objects.all())
    jugador = serializers.PrimaryKeyRelatedField(
        queryset=Jugador.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Docente
        fields = ["docente_id", "persona", "jugador", "legajo"]
        read_only_fields = ["docente_id"]
