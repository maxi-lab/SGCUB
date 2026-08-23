from rest_framework import serializers
from django.db import transaction
from .models import Persona, Socio, Categoria, Jugador, Docente


class PersonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Persona
        fields = ["persona_id", "nombre", "apellido", "dni"]
        read_only_fields = ["persona_id"]



class SocioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="persona.nombre")
    apellido = serializers.CharField(source="persona.apellido")
    dni = serializers.CharField(source="persona.dni")

    class Meta:
        model = Socio
        fields = [
            "socio_id",
            "nombre",
            "apellido",
            "dni",
            "telefono",
        ]

    def validate_dni(self, value):
        persona = getattr(self.instance, "persona", None)
        personas = Persona.objects.filter(dni=value)

        if persona is not None:
            personas = personas.exclude(pk=persona.pk)

        if personas.exists():
            raise serializers.ValidationError("persona with this dni already exists.")

        return value

    @transaction.atomic
    def create(self, validated_data):
        persona_data = validated_data.pop("persona")
        persona = Persona.objects.create(**persona_data)
        socio = Socio.objects.create(persona=persona, **validated_data)
        return socio

    @transaction.atomic
    def update(self, instance, validated_data):
        persona_data = validated_data.pop("persona", None)

        if persona_data:
            persona = instance.persona
            for attr, value in persona_data.items():
                setattr(persona, attr, value)
            persona.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["categoria_id", "nombre"]
        read_only_fields = ["categoria_id"]


class JugadorSerializer(serializers.ModelSerializer):
    """Para create/update: recibe y devuelve IDs planos"""
    class Meta:
        model = Jugador
        fields = ['jugador_id', 'socio', 'categoria']


class JugadorSerializerDitail(serializers.ModelSerializer):
    socio = SocioSerializer(read_only=True)
    socio_id = serializers.PrimaryKeyRelatedField(queryset=Socio.objects.all(), source="socio", write_only=True)
    categoria = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all())

    class Meta:
        model = Jugador
        fields = ["jugador_id", "socio", "socio_id", "categoria"]
        read_only_fields = ["jugador_id"]


class DocenteSerializer(serializers.ModelSerializer):
    persona = serializers.PrimaryKeyRelatedField(queryset=Persona.objects.all())

    class Meta:
        model = Docente
        fields = ["docente_id", "persona", "legajo"]
        read_only_fields = ["docente_id"]
