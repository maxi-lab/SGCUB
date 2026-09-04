from rest_framework import serializers
from django.db import transaction
from .models import Persona, Socio, Categoria, Jugador, Docente, EstadoDeportivo, ContactoEmergencia, EstadoSocio, Genero, Localidad, Domicilio


class GeneroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genero
        fields = "__all__"


class LocalidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Localidad
        fields = "__all__"


class DomicilioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domicilio
        fields = "__all__"


class EstadoSocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoSocio
        fields = "__all__"


class PersonaSerializer(serializers.ModelSerializer):
    dni = serializers.CharField(max_length=20, validators=[])
    email = serializers.EmailField(max_length=100, validators=[], required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = Persona
        fields = ["persona_id", "nombre", "apellido", "dni", "telefono", "email"]
        read_only_fields = ["persona_id"]

    def validate(self, attrs):
        dni = attrs.get('dni')
        email = attrs.get('email')
        
        if dni and not dni.isdigit():
            raise serializers.ValidationError({"dni": "El DNI debe contener solo números."})
        
        persona = getattr(self.instance, "persona", None) or self.instance
        if not persona and dni:
            from .models import Persona
            persona = Persona.objects.filter(dni=dni).first()

        if dni:
            from .models import Persona
            qs = Persona.objects.filter(dni=dni)
            if persona:
                qs = qs.exclude(pk=persona.pk)
            if qs.exists():
                raise serializers.ValidationError({"dni": "Ya existe una persona con este DNI."})

        if email:
            from .models import Persona
            qs = Persona.objects.filter(email=email)
            if persona:
                qs = qs.exclude(pk=persona.pk)
            if qs.exists():
                raise serializers.ValidationError({"email": "Ya existe una persona con este email."})
                
        return attrs

class SocioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="persona.nombre")
    apellido = serializers.CharField(source="persona.apellido")
    dni = serializers.CharField(source="persona.dni")
    telefono = serializers.CharField(source="persona.telefono")
    email = serializers.EmailField(source="persona.email", required=False, allow_null=True, allow_blank=True)
    fecha_nacimiento = serializers.DateField(source="persona.fecha_nacimiento", required=False, allow_null=True)
    genero = serializers.PrimaryKeyRelatedField(source="persona.genero", queryset=Genero.objects.all(), required=False, allow_null=True)
    genero_nombre = serializers.CharField(source="persona.genero.nombre", read_only=True)
    genero_otro = serializers.CharField(source="persona.genero_otro", required=False, allow_null=True, allow_blank=True)
    
    domicilio_calle = serializers.CharField(source="persona.domicilio.calle", required=False, allow_null=True, allow_blank=True)
    domicilio_numero = serializers.CharField(source="persona.domicilio.numero", required=False, allow_null=True, allow_blank=True)
    domicilio_piso = serializers.CharField(source="persona.domicilio.piso", required=False, allow_null=True, allow_blank=True)
    domicilio_departamento = serializers.CharField(source="persona.domicilio.departamento", required=False, allow_null=True, allow_blank=True)
    domicilio_entre_calle_1 = serializers.CharField(source="persona.domicilio.entre_calle_1", required=False, allow_null=True, allow_blank=True)
    domicilio_entre_calle_2 = serializers.CharField(source="persona.domicilio.entre_calle_2", required=False, allow_null=True, allow_blank=True)
    domicilio_barrio = serializers.CharField(source="persona.domicilio.barrio", required=False, allow_null=True, allow_blank=True)
    domicilio_localidad = serializers.PrimaryKeyRelatedField(source="persona.domicilio.localidad", queryset=Localidad.objects.all(), required=False, allow_null=True)
    
    estado_socio = serializers.PrimaryKeyRelatedField(
        queryset=EstadoSocio.objects.all(),
        required=False
    )
    estado_socio_nombre = serializers.CharField(source="estado_socio.nombre", read_only=True)

    class Meta:
        model = Socio
        fields = [
            "socio_id", "numero_socio", "nombre", "apellido", "dni", "telefono", "email", 
            "fecha_nacimiento", "genero", "genero_nombre", "genero_otro", 
            "domicilio_calle", "domicilio_numero", "domicilio_piso", "domicilio_departamento", "domicilio_entre_calle_1", "domicilio_entre_calle_2", "domicilio_barrio", "domicilio_localidad",
            "estado_socio", "estado_socio_nombre", "fecha_alta"
        ]
        read_only_fields = ["numero_socio", "fecha_alta"]

    def validate(self, attrs):
        persona_data = attrs.get('persona', {})
        dni = persona_data.get('dni')
        email = persona_data.get('email')
        
        if dni and not dni.isdigit():
            raise serializers.ValidationError({"dni": "El DNI debe contener solo números."})
            
        persona = getattr(self.instance, "persona", None)
        if not persona and dni:
            persona = Persona.objects.filter(dni=dni).first()

        if dni:
            qs = Persona.objects.filter(dni=dni)
            if persona:
                qs = qs.exclude(pk=persona.pk)
            
            if qs.exists():
                raise serializers.ValidationError({"dni": "Ya existe una persona con este DNI."})
            
            if not getattr(self.instance, "persona", None) and persona:
                if hasattr(persona, "socio"):
                    if hasattr(persona.socio, "jugador"):
                        raise serializers.ValidationError({"dni": "La persona con este DNI ya tiene un socio registrado como jugador."})
                    elif self.parent is None:
                        raise serializers.ValidationError({"dni": "Ya existe un socio asociado a esta persona (DNI existente)."})

        if email:
            qs = Persona.objects.filter(email=email)
            if persona:
                qs = qs.exclude(pk=persona.pk)
            if qs.exists():
                raise serializers.ValidationError({"email": "Ya existe una persona con este email."})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        persona_data = validated_data.pop("persona")
        dni = persona_data.get("dni")
        if not persona_data.get("email"):
            persona_data["email"] = None
            
        domicilio_data = persona_data.pop("domicilio", None)
        if domicilio_data:
            domicilio_data = {k: v for k, v in domicilio_data.items() if v is not None}
            if domicilio_data:
                persona_data["domicilio"] = Domicilio.objects.create(**domicilio_data)
                
        persona, _ = Persona.objects.update_or_create(dni=dni, defaults=persona_data)
        return Socio.objects.create(persona=persona, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        persona_data = validated_data.pop("persona", None)
        if persona_data:
            if not persona_data.get("email"):
                persona_data["email"] = None
                
            domicilio_data = persona_data.pop("domicilio", None)
            if domicilio_data:
                domicilio_data = {k: v for k, v in domicilio_data.items() if v is not None}
                if instance.persona.domicilio:
                    for attr, value in domicilio_data.items():
                        setattr(instance.persona.domicilio, attr, value)
                    instance.persona.domicilio.save()
                elif domicilio_data:
                    instance.persona.domicilio = Domicilio.objects.create(**domicilio_data)
                    
            for attr, value in persona_data.items():
                setattr(instance.persona, attr, value)
            instance.persona.save()
        return super().update(instance, validated_data)


class CategoriaSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(max_length=50)
    anio_vigente = serializers.IntegerField()
    edad_maxima = serializers.IntegerField(min_value=0)
    genero = serializers.ChoiceField(choices=Categoria.GENERO_CHOICES)

    class Meta:
        model = Categoria
        fields = [
            "categoria_id",
            "nombre",
            "anio_vigente",
            "edad_maxima",
            "genero",
        ]
        read_only_fields = ["categoria_id"]

    def validate_nombre(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("El nombre es obligatorio.")
        return value

    def validate_anio_vigente(self, value):
        if value < 1900:
            raise serializers.ValidationError("El año vigente no es válido.")
        return value

    def validate(self, attrs):
        def actual(campo):
            if campo in attrs:
                return attrs[campo]
            return getattr(self.instance, campo, None)
        nombre = actual("nombre")
        anio_vigente = actual("anio_vigente")
        genero = actual("genero")
        if nombre and anio_vigente and genero:
            categorias = Categoria.objects.filter(
                nombre__iexact=nombre,
                anio_vigente=anio_vigente,
                genero=genero,
            )
            if self.instance is not None:
                categorias = categorias.exclude(pk=self.instance.pk)
            if categorias.exists():
                raise serializers.ValidationError(
                    "Ya existe una categoría con ese nombre, año vigente y género."
                )
        return attrs


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
            dni = persona_data.get("dni")
            if not persona_data.get("email"):
                persona_data["email"] = None
            persona, _ = Persona.objects.update_or_create(dni=dni, defaults=persona_data)
            instance.persona = persona
            instance.save()
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

        if not validated_data.get("categoria"):
            from .models import get_default_categoria
            validated_data.pop("categoria", None)
            validated_data["categoria_id"] = get_default_categoria()

        if not validated_data.get("estado"):
            from .models import get_default_estado_deportivo
            validated_data.pop("estado", None)
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
