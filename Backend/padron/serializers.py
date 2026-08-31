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

    def _get_current_persona(self):
        persona = getattr(self.instance, "persona", None) or self.instance
        if not persona and self.parent:
            parent_inst = getattr(self.parent, "instance", None)
            if parent_inst:
                if hasattr(parent_inst, "persona") and parent_inst.persona:
                    persona = parent_inst.persona
                elif hasattr(parent_inst, "socio") and parent_inst.socio:
                    persona = parent_inst.socio.persona
        return persona

    def validate_email(self, value):
        if not value:
            return None
        persona = self._get_current_persona()
        if not persona and hasattr(self, "initial_data") and self.initial_data.get("dni"):
            persona = Persona.objects.filter(dni=self.initial_data.get("dni")).first()

        if self.parent is None or persona:
            personas = Persona.objects.filter(email=value)
            if persona is not None:
                personas = personas.exclude(pk=persona.pk)
            if personas.exists():
                raise serializers.ValidationError("Ya existe una persona con este email.")
        return value

    def validate_dni(self, value):
        persona = self._get_current_persona()
        if self.parent is None or persona:
            personas = Persona.objects.filter(dni=value)
            if persona is not None:
                personas = personas.exclude(pk=persona.pk)
            if personas.exists():
                raise serializers.ValidationError("Ya existe una persona con este DNI.")
        return value


class SocioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="persona.nombre")
    apellido = serializers.CharField(source="persona.apellido")
    dni = serializers.CharField(source="persona.dni")
    telefono = serializers.CharField(source="persona.telefono")
    email = serializers.EmailField(source="persona.email", required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Socio
        fields = ["socio_id", "nombre", "apellido", "dni", "telefono", "email"]

    def _get_current_persona(self):
        persona = getattr(self.instance, "persona", None)
        if not persona and self.parent:
            parent_instance = getattr(self.parent, "instance", None)
            if parent_instance:
                if hasattr(parent_instance, "socio") and parent_instance.socio:
                    persona = parent_instance.socio.persona
                elif hasattr(parent_instance, "persona") and parent_instance.persona:
                    persona = parent_instance.persona
        return persona

    def validate_email(self, value):
        if not value:
            return None
        persona = self._get_current_persona()
        if not persona and hasattr(self, "initial_data") and self.initial_data.get("dni"):
            persona = Persona.objects.filter(dni=self.initial_data.get("dni")).first()

        personas = Persona.objects.filter(email=value)
        if persona is not None:
            personas = personas.exclude(pk=persona.pk)
        if personas.exists():
            raise serializers.ValidationError("Ya existe una persona con este email.")
        return value

    def validate_dni(self, value):
        persona = self._get_current_persona()
        personas = Persona.objects.filter(dni=value)
        if persona is not None:
            personas = personas.exclude(pk=persona.pk)
            if personas.exists():
                raise serializers.ValidationError("Ya existe una persona con este DNI.")
        else:
            if personas.exists():
                persona_obj = personas.first()
                if hasattr(persona_obj, "socio"):
                    if hasattr(persona_obj.socio, "jugador"):
                        raise serializers.ValidationError("La persona con este DNI ya tiene un socio registrado como jugador.")
                    elif self.parent is None:
                        raise serializers.ValidationError("Ya existe un socio asociado a esta persona (DNI existente).")
        return value

    @transaction.atomic
    def create(self, validated_data):
        persona_data = validated_data.pop("persona")
        dni = persona_data.get("dni")
        if not persona_data.get("email"):
            persona_data["email"] = None
        persona, _ = Persona.objects.update_or_create(dni=dni, defaults=persona_data)
        return Socio.objects.create(persona=persona, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        persona_data = validated_data.pop("persona", None)
        if persona_data:
            if not persona_data.get("email"):
                persona_data["email"] = None
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
        if not persona_data.get("email"):
            persona_data["email"] = None
        persona, _ = Persona.objects.update_or_create(dni=dni, defaults=persona_data)
        validated_data.pop("contacto_emergencia_id", None)
        return ContactoEmergencia.objects.create(persona=persona, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        persona_data = validated_data.pop("persona", None)
        validated_data.pop("contacto_emergencia_id", None)
        if persona_data:
            if not persona_data.get("email"):
                persona_data["email"] = None
            for attr, value in persona_data.items():
                setattr(instance.persona, attr, value)
            instance.persona.save()
        return super().update(instance, validated_data)


class JugadorSerializer(serializers.ModelSerializer):
    socio = serializers.PrimaryKeyRelatedField(queryset=Socio.objects.all(), required=False, allow_null=True)
    nuevo_socio = SocioSerializer(required=False, write_only=True, allow_null=True)
    categoria = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all(), allow_null=True, required=False)
    estado = serializers.PrimaryKeyRelatedField(queryset=EstadoDeportivo.objects.all(), allow_null=True, required=False)
    contactos_emergencia = ContactoEmergenciaSerializer(many=True, required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['contactos_emergencia'].child.fields['jugador'].read_only = True

    class Meta:
        model = Jugador
        fields = [
            "jugador_id",
            "socio",
            "nuevo_socio",
            "categoria",
            "obra_social",
            "tallaIndumentaria",
            "estado",
            "contactos_emergencia",
        ]

    def validate(self, attrs):
        socio = attrs.get('socio')
        nuevo_socio = attrs.get('nuevo_socio')

        if self.instance is None and not socio and not nuevo_socio:
            raise serializers.ValidationError({"socio": "Debe seleccionar un socio existente o ingresar los datos de un nuevo socio."})

        if socio:
            jugadores = Jugador.objects.filter(socio=socio)
            if self.instance is not None:
                jugadores = jugadores.exclude(pk=self.instance.pk)
            if jugadores.exists():
                raise serializers.ValidationError({"socio": "Este socio ya tiene un jugador asociado."})

        if nuevo_socio and self.instance is None:
            persona_data = nuevo_socio.get('persona', {})
            dni = persona_data.get('dni')
            if dni:
                persona = Persona.objects.filter(dni=dni).first()
                if persona and hasattr(persona, 'socio') and hasattr(persona.socio, 'jugador'):
                    raise serializers.ValidationError({"nuevo_socio": "La persona con este DNI ya tiene un socio registrado como jugador."})

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

    @transaction.atomic
    def create(self, validated_data):
        nuevo_socio_data = validated_data.pop("nuevo_socio", None)
        if nuevo_socio_data:
            socio_serializer = SocioSerializer()
            socio = socio_serializer.create(nuevo_socio_data)
            validated_data["socio"] = socio

        if "categoria" not in validated_data or not validated_data["categoria"]:
            from .models import get_default_categoria
            validated_data["categoria_id"] = get_default_categoria()

        if "estado" not in validated_data or not validated_data["estado"]:
            from .models import get_default_estado_deportivo
            validated_data["estado_id"] = get_default_estado_deportivo()

        contactos_data = validated_data.pop("contactos_emergencia", [])
        jugador = Jugador.objects.create(**validated_data)
        for contacto_data in contactos_data:
            contacto_data["jugador"] = jugador
            ContactoEmergenciaSerializer().create(contacto_data)
        return jugador

    @transaction.atomic
    def update(self, instance, validated_data):
        nuevo_socio_data = validated_data.pop("nuevo_socio", None)
        if nuevo_socio_data:
            socio_serializer = SocioSerializer()
            if hasattr(instance, 'socio') and instance.socio:
                socio = socio_serializer.update(instance.socio, nuevo_socio_data)
            else:
                socio = socio_serializer.create(nuevo_socio_data)
            validated_data["socio"] = socio

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
