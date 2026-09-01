from rest_framework import serializers
from django.db import transaction
from .models import Persona, Socio, Categoria, Jugador, Docente, EstadoDeportivo, ContactoEmergencia


class PersonaSerializer(serializers.ModelSerializer):
    dni = serializers.CharField(max_length=20, validators=[])
    email = serializers.EmailField(max_length=100, validators=[], required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = Persona
        fields = ["persona_id", "nombre", "apellido", "dni", "telefono", "email"]
        read_only_fields = ["persona_id"]

    def validate_email(self, value):
        if self.parent is None and value:
            personas = Persona.objects.filter(email=value)
            if self.instance is not None:
                personas = personas.exclude(pk=self.instance.pk)
            if personas.exists():
                raise serializers.ValidationError("Ya existe una persona con este email.")
        return value

    def validate_dni(self, value):
        if self.parent is None:
            personas = Persona.objects.filter(dni=value)
            if self.instance is not None:
                personas = personas.exclude(pk=self.instance.pk)
            if personas.exists():
                raise serializers.ValidationError("Ya existe una persona con este DNI.")
        return value


class SocioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="persona.nombre")
    apellido = serializers.CharField(source="persona.apellido")
    dni = serializers.CharField(source="persona.dni")
    telefono = serializers.CharField(source="persona.telefono")
    email = serializers.EmailField(source="persona.email")

    class Meta:
        model = Socio
        fields = ["socio_id", "nombre", "apellido", "dni", "telefono", "email"]

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
        persona = Persona.objects.create(**validated_data.pop("persona"))
        return Socio.objects.create(persona=persona, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        persona_data = validated_data.pop("persona", None)
        if persona_data:
            for attr, value in persona_data.items():
                setattr(instance.persona, attr, value)
            instance.persona.save()
        return super().update(instance, validated_data)


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


class ContactoEmergenciaSerializer(serializers.ModelSerializer):
    contacto_emergencia_id = serializers.IntegerField(required=False)
    persona = PersonaSerializer()
    jugador = serializers.PrimaryKeyRelatedField(queryset=Jugador.objects.all(), required=False)

    class Meta:
        model = ContactoEmergencia
        fields = ['contacto_emergencia_id', 'persona', 'jugador', 'responsable_legal', 'relacion']

    def validate(self, attrs):
        persona_data = attrs.get('persona', {})
        if not persona_data.get('telefono'):
            raise serializers.ValidationError({'persona': {'telefono': 'El teléfono es obligatorio para los contactos de emergencia.'}})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        persona_data = validated_data.pop("persona")
        dni = persona_data.get("dni")
        persona, _ = Persona.objects.update_or_create(dni=dni, defaults=persona_data)
        validated_data.pop("contacto_emergencia_id", None)
        return ContactoEmergencia.objects.create(persona=persona, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        persona_data = validated_data.pop("persona", None)
        validated_data.pop("contacto_emergencia_id", None)
        if persona_data:
            for attr, value in persona_data.items():
                setattr(instance.persona, attr, value)
            instance.persona.save()
        return super().update(instance, validated_data)


class JugadorSerializer(serializers.ModelSerializer):
    socio = serializers.PrimaryKeyRelatedField(queryset=Socio.objects.all(), validators=[])
    categoria = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all(), allow_null=False, required=True)
    estado = serializers.PrimaryKeyRelatedField(queryset=EstadoDeportivo.objects.all(), allow_null=False, required=True)
    contactos_emergencia = ContactoEmergenciaSerializer(many=True, required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['contactos_emergencia'].child.fields['jugador'].read_only = True

    class Meta:
        model = Jugador
        fields = ["jugador_id", "socio", "categoria", "obra_social", "tallaIndumentaria", "estado", "contactos_emergencia"]

    def validate(self, attrs):
        for contacto in attrs.get('contactos_emergencia', []):
            persona_data = contacto.get('persona', {})
            telefono = persona_data.get('telefono')
            if not telefono:
                raise serializers.ValidationError({'contactos_emergencia': 'El teléfono es obligatorio para los contactos de emergencia.'})

            dni = persona_data.get('dni')
            if not dni:
                continue
            
            contacto_id = contacto.get('contacto_emergencia_id')
            
            if not contacto_id and self.instance:
                if self.instance.contactos_emergencia.filter(persona__dni=dni).exists():
                    raise serializers.ValidationError({'contactos_emergencia': 'Esta persona ya es contacto de emergencia de este jugador.'})

            personas = Persona.objects.filter(dni=dni)
            if contacto_id:
                try:
                    personas = personas.exclude(pk=ContactoEmergencia.objects.get(pk=contacto_id).persona_id)
                except ContactoEmergencia.DoesNotExist:
                    raise serializers.ValidationError({'contactos_emergencia': 'El contacto indicado no pertenece al jugador.'})
        return attrs

    def validate_socio(self, value):
        jugadores = Jugador.objects.filter(socio=value)
        if self.instance is not None:
            jugadores = jugadores.exclude(pk=self.instance.pk)
        if jugadores.exists():
            raise serializers.ValidationError("Este socio ya tiene un jugador asociado.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        contactos_data = validated_data.pop("contactos_emergencia", [])
        jugador = Jugador.objects.create(**validated_data)
        for contacto_data in contactos_data:
            contacto_data["jugador"] = jugador
            ContactoEmergenciaSerializer().create(contacto_data)
        return jugador

    @transaction.atomic
    def update(self, instance, validated_data):
        contactos_data = validated_data.pop("contactos_emergencia", None)
        jugador = super().update(instance, validated_data)
        if contactos_data is not None:
            contactos_ids = set()
            for contacto_data in contactos_data:
                contacto_id = contacto_data.get("contacto_emergencia_id")
                contacto_data["jugador"] = jugador
                if contacto_id:
                    contacto = instance.contactos_emergencia.get(pk=contacto_id)
                    ContactoEmergenciaSerializer().update(contacto, contacto_data)
                    contactos_ids.add(contacto_id)
                else:
                    new_contacto = ContactoEmergenciaSerializer().create(contacto_data)
                    contactos_ids.add(new_contacto.pk)
            instance.contactos_emergencia.exclude(pk__in=contactos_ids).delete()
        return jugador


class JugadorListSerializer(serializers.ModelSerializer):
    socio = SocioSerializer(read_only=True)
    categoria = CategoriaSerializer(read_only=True)
    estado = EstadoDeportivoSerializer(read_only=True)
    contactos_emergencia = ContactoEmergenciaSerializer(many=True, read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['contactos_emergencia'].child.fields['jugador'].read_only = True

    class Meta:
        model = Jugador
        fields = ["jugador_id", "socio", "categoria", "obra_social", "tallaIndumentaria", "estado", "contactos_emergencia"]


class JugadorSerializerDetail(serializers.ModelSerializer):
    socio = SocioSerializer(read_only=True)
    categoria = CategoriaSerializer(read_only=True)
    estado = EstadoDeportivoSerializer(read_only=True)
    contactos_emergencia = serializers.SerializerMethodField()

    def get_contactos_emergencia(self, jugador):
        return ContactoEmergenciaSerializer(jugador.contactos_emergencia.select_related("persona"), many=True).data

    class Meta:
        model = Jugador
        fields = ["jugador_id", "socio", "categoria", "obra_social", "tallaIndumentaria", "contactos_emergencia", "estado"]
        read_only_fields = ["jugador_id"]


class DocenteSerializer(serializers.ModelSerializer):
    persona = serializers.PrimaryKeyRelatedField(queryset=Persona.objects.all())

    class Meta:
        model = Docente
        fields = ["docente_id", "persona", "legajo"]
        read_only_fields = ["docente_id"]
