from rest_framework import serializers
from django.db import transaction
from .models import Persona, Socio, Categoria, Jugador, Docente, EstadoDeportivo


class PersonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Persona
        fields = ["persona_id", "nombre", "apellido", "dni", "telefono", "email"]
        read_only_fields = ["persona_id"]



class SocioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="persona.nombre")
    apellido = serializers.CharField(source="persona.apellido")
    dni = serializers.CharField(source="persona.dni")
    telefono = serializers.CharField(source="persona.telefono")
    email = serializers.EmailField(source="persona.email")
    fecha_nacimiento=serializers.DateField(source="persona.fecha_nacimiento")

    class Meta:
        model = Socio
        fields = [
            "socio_id",
            "nombre",
            "apellido",
            "dni",
            "telefono",
            "email",
            "fecha_nacimiento"
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


class EstadoDeportivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoDeportivo
        fields = ["estado_id", "nombre"]
        read_only_fields = ["estado_id"]


class JugadorSerializer(serializers.ModelSerializer):
    """Para create/update: recibe y devuelve IDs planos"""
    socio = serializers.PrimaryKeyRelatedField(
        queryset=Socio.objects.all(),
        validators=[],
    )
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        allow_null=False,
        required=True,
    )
    estado = serializers.PrimaryKeyRelatedField(
        queryset=EstadoDeportivo.objects.all(),
        allow_null=False,
        required=True,
    )

    class Meta:
        model = Jugador
        fields = [
            'jugador_id',
            'socio',
            'categoria',
            'obra_social',
            'tallaIndumentaria',
            'contactoEmergencia',
            'estado',
        ]

    def validate_socio(self, value):
        jugador = getattr(self, 'instance', None)
        jugadores = Jugador.objects.filter(socio=value)

        if jugador is not None:
            jugadores = jugadores.exclude(pk=jugador.pk)

        if jugadores.exists():
            raise serializers.ValidationError(
                'Este socio ya tiene un jugador asociado.'
            )

        return value


class JugadorListSerializer(serializers.ModelSerializer):
    socio = SocioSerializer(read_only=True)
    categoria = CategoriaSerializer(read_only=True)
    estado = EstadoDeportivoSerializer(read_only=True)

    class Meta:
        model = Jugador
        fields = [
            'jugador_id',
            'socio',
            'categoria',
            'obra_social',
            'tallaIndumentaria',
            'contactoEmergencia',
            'estado',
        ]


class JugadorSerializerDetail(serializers.ModelSerializer):
    socio = SocioSerializer(read_only=True)
    categoria = CategoriaSerializer(read_only=True)
    estado = EstadoDeportivoSerializer(read_only=True)

    class Meta:
        model = Jugador
        fields = [
            "jugador_id",
            "socio",
            "categoria",
            "obra_social",
            "tallaIndumentaria",
            "contactoEmergencia",
            "estado",
        ]
        read_only_fields = ["jugador_id"]


class DocenteSerializer(serializers.ModelSerializer):
    persona = serializers.PrimaryKeyRelatedField(queryset=Persona.objects.all())

    class Meta:
        model = Docente
        fields = ["docente_id", "persona", "legajo"]
        read_only_fields = ["docente_id"]
