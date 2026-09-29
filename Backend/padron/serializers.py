import re

from rest_framework import serializers
from django.db import transaction
from .models import DocenteCategoria, Persona, Socio, Categoria, Jugador, Docente, EstadoDeportivo, ContactoEmergencia, EstadoSocio, Genero, Localidad, Domicilio


DNI_REGEX = re.compile(r"\d{7,8}")
MANDATORY_PERSONA_FIELDS = {
    "nombre": ("nombre",),
    "apellido": ("apellido",),
    "dni": ("dni",),
    "telefono": ("telefono",),
    "email": ("email",),
    "fecha_nacimiento": ("fecha_nacimiento",),
    "genero": ("genero",),
    "domicilio_calle": ("domicilio", "calle"),
    "domicilio_numero": ("domicilio", "numero"),
    "domicilio_localidad": ("domicilio", "localidad"),
}

MANDATORY_CONTACT_FIELDS = {
    field: MANDATORY_PERSONA_FIELDS[field] for field in ("nombre", "apellido", "dni", "telefono")
}


def validate_dni(value):
    if not DNI_REGEX.fullmatch(value or ""):
        raise serializers.ValidationError("El DNI debe ser numérico y tener entre 7 y 8 dígitos.")


def validate_obligatory_fields(data, is_creation, fields=MANDATORY_PERSONA_FIELDS):
    errors = {}
    for field, path in fields.items():
        value = data
        present = True
        for key in path:
            if not isinstance(value, dict) or key not in value:
                present = False
                break
            value = value[key]
        if (is_creation and not present) or (present and value in (None, "")):
            errors[field] = ["Este campo es obligatorio."]
    if errors:
        raise serializers.ValidationError(errors)


def get_persona_profiles(person):
    member = getattr(person, "socio", None)
    player = getattr(member, "jugador", None) if member else None
    teacher = getattr(person, "docente", None)
    return {
        "persona_id": person.pk,
        "socio_id": member.pk if member else None,
        "jugador_id": player.pk if player else None,
        "docente_id": teacher.pk if teacher else None,
    }


def duplicated_dni_error(person, message="Ya existe una persona con este DNI."):
    profiles = {key: pk for key, pk in get_persona_profiles(person).items() if pk is not None}
    return serializers.ValidationError({"dni": [message], "persona_existente": profiles})


def validate_dni_uniqueness(dni, current_person=None):
    if not dni:
        return
    people = Persona.objects.all()
    if current_person is not None:
        people = people.exclude(pk=current_person.pk)
    existing = people.filter(dni=dni).first()
    if existing is not None:
        raise duplicated_dni_error(existing)


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
    nombre = serializers.CharField(max_length=50, required=False)
    apellido = serializers.CharField(max_length=50, required=False)
    dni = serializers.CharField(max_length=8, required=False, validators=[validate_dni])
    telefono = serializers.CharField(max_length=20, required=False)
    email = serializers.EmailField(max_length=100, validators=[], required=False, allow_null=True, allow_blank=True)
    edad = serializers.IntegerField(read_only=True)
    perfiles = serializers.SerializerMethodField()
    genero = serializers.PrimaryKeyRelatedField(queryset=Genero.objects.all(), required=False, allow_null=True)
    genero_nombre = serializers.CharField(source="genero.nombre", read_only=True)
    domicilio_calle = serializers.CharField(source="domicilio.calle", required=False, allow_blank=True, allow_null=True)
    domicilio_numero = serializers.CharField(source="domicilio.numero", required=False, allow_blank=True, allow_null=True)
    domicilio_piso = serializers.CharField(source="domicilio.piso", required=False, allow_blank=True, allow_null=True)
    domicilio_departamento = serializers.CharField(source="domicilio.departamento", required=False, allow_blank=True, allow_null=True)
    domicilio_entre_calle_1 = serializers.CharField(source="domicilio.entre_calle_1", required=False, allow_blank=True, allow_null=True)
    domicilio_entre_calle_2 = serializers.CharField(source="domicilio.entre_calle_2", required=False, allow_blank=True, allow_null=True)
    domicilio_barrio = serializers.CharField(source="domicilio.barrio", required=False, allow_blank=True, allow_null=True)
    domicilio_localidad = serializers.PrimaryKeyRelatedField(source="domicilio.localidad", queryset=Localidad.objects.all(), required=False, allow_null=True)
    domicilio_localidad_nombre = serializers.CharField(source="domicilio.localidad.nombre", read_only=True)

    class Meta:
        model = Persona
        fields = [
            "persona_id", "nombre", "apellido", "dni", "telefono", "email",
            "fecha_nacimiento", "edad", "genero", "genero_nombre", "genero_otro",
            "domicilio_calle", "domicilio_numero", "domicilio_piso",
            "domicilio_departamento", "domicilio_entre_calle_1",
            "domicilio_entre_calle_2", "domicilio_barrio", "domicilio_localidad",
            "domicilio_localidad_nombre", "perfiles",
        ]
        read_only_fields = ["persona_id"]

    def get_perfiles(self, person):
        profiles = get_persona_profiles(person)
        profiles.pop("persona_id")
        return profiles

    @transaction.atomic
    def create(self, validated_data):
        address_data = validated_data.pop("domicilio", None)
        if address_data:
            address_data = {key: value for key, value in address_data.items() if value not in (None, "")}
            if address_data.get("calle") and address_data.get("numero") and address_data.get("localidad"):
                validated_data["domicilio"] = Domicilio.objects.create(**address_data)
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        address_data = validated_data.pop("domicilio", None)
        if address_data:
            address_data = {key: value for key, value in address_data.items() if value not in (None, "")}
            if instance.domicilio:
                for attribute, value in address_data.items():
                    setattr(instance.domicilio, attribute, value)
                instance.domicilio.save()
            elif address_data.get("calle") and address_data.get("numero") and address_data.get("localidad"):
                instance.domicilio = Domicilio.objects.create(**address_data)
                instance.save(update_fields=["domicilio"])
        return super().update(instance, validated_data)

    def validate(self, attrs):
        validate_obligatory_fields(attrs, is_creation=self.instance is None)
        validate_dni_uniqueness(attrs.get("dni"), self.instance)
        return attrs


class PersonaContactoSerializer(PersonaSerializer):
    def validate(self, attrs):
        is_creation = not getattr(self.root, "partial", False)
        validate_obligatory_fields(attrs, is_creation, MANDATORY_CONTACT_FIELDS)
        return attrs

class SocioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="persona.nombre")
    apellido = serializers.CharField(source="persona.apellido")
    dni = serializers.CharField(source="persona.dni", max_length=8, validators=[validate_dni])
    telefono = serializers.CharField(source="persona.telefono")
    email = serializers.EmailField(source="persona.email", required=False, allow_null=True, allow_blank=True)
    fecha_nacimiento = serializers.DateField(source="persona.fecha_nacimiento", required=False, allow_null=True)
    edad = serializers.IntegerField(source="persona.edad", read_only=True)
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
            "fecha_nacimiento", "edad", "genero", "genero_nombre", "genero_otro",
            "domicilio_calle", "domicilio_numero", "domicilio_piso", "domicilio_departamento", "domicilio_entre_calle_1", "domicilio_entre_calle_2", "domicilio_barrio", "domicilio_localidad",
            "estado_socio", "estado_socio_nombre", "fecha_alta"
        ]
        read_only_fields = ["numero_socio", "fecha_alta"]

    def validate(self, attrs):
        person_data = attrs.get("persona", {})
        dni = person_data.get("dni")
        is_creation = self.instance is None and not getattr(self.root, "partial", False)
        validate_obligatory_fields(person_data, is_creation)

        person = getattr(self.instance, "persona", None)
        if person is None and dni:
            person = Persona.objects.filter(dni=dni).first()
            member = getattr(person, "socio", None)
            if member is not None:
                if hasattr(member, "jugador"):
                    raise duplicated_dni_error(person, "La persona con este DNI ya está registrada como jugador.")
                if self.parent is None:
                    raise duplicated_dni_error(person, "Ya existe un socio con este DNI.")

        validate_dni_uniqueness(dni, person)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        person_data = validated_data.pop("persona")
        dni = person_data.get("dni")
        if not person_data.get("email"):
            person_data["email"] = None

        address_data = person_data.pop("domicilio", None)
        if address_data:
            address_data = {k: v for k, v in address_data.items() if v is not None}
            if address_data:
                person_data["domicilio"] = Domicilio.objects.create(**address_data)

        person, _ = Persona.objects.update_or_create(dni=dni, defaults=person_data)
        return Socio.objects.create(persona=person, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        person_data = validated_data.pop("persona", None)
        if person_data:
            if not person_data.get("email"):
                person_data["email"] = None

            address_data = person_data.pop("domicilio", None)
            if address_data:
                address_data = {k: v for k, v in address_data.items() if v is not None}
                if instance.persona.domicilio:
                    for attr, value in address_data.items():
                        setattr(instance.persona.domicilio, attr, value)
                    instance.persona.domicilio.save()
                elif address_data:
                    instance.persona.domicilio = Domicilio.objects.create(**address_data)

            for attr, value in person_data.items():
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
        def current(field):
            if field in attrs:
                return attrs[field]
            return getattr(self.instance, field, None)
        name = current("nombre")
        current_year = current("anio_vigente")
        gender = current("genero")
        if name and current_year and gender:
            categories = Categoria.objects.filter(
                nombre__iexact=name,
                anio_vigente=current_year,
                genero=gender,
            )
            if self.instance is not None:
                categories = categories.exclude(pk=self.instance.pk)
            if categories.exists():
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
    persona = PersonaContactoSerializer()
    jugador = serializers.PrimaryKeyRelatedField(queryset=Jugador.objects.all(), required=False)

    class Meta:
        model = ContactoEmergencia
        fields = ['contacto_emergencia_id', 'persona', 'jugador', 'responsable_legal', 'relacion']

    def validate(self, attrs):
        person_data = attrs.get('persona', {})
        if not person_data.get('telefono'):
            raise serializers.ValidationError({'persona': {'telefono': 'El teléfono es obligatorio para los contactos de emergencia.'}})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        person_data = validated_data.pop("persona")
        dni = person_data.get("dni")
        if not person_data.get("email"):
            person_data["email"] = None
        person, _ = Persona.objects.update_or_create(dni=dni, defaults=person_data)
        validated_data.pop("contacto_emergencia_id", None)
        return ContactoEmergencia.objects.create(persona=person, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        person_data = validated_data.pop("persona", None)
        validated_data.pop("contacto_emergencia_id", None)
        if person_data:
            dni = person_data.get("dni")
            if not person_data.get("email"):
                person_data["email"] = None
            person, _ = Persona.objects.update_or_create(dni=dni, defaults=person_data)
            instance.persona = person
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
        member = attrs.get('socio')
        new_member = attrs.get('nuevo_socio')

        if self.instance is None and not member and not new_member:
            raise serializers.ValidationError({"socio": "Debe seleccionar un socio existente o ingresar los datos de un nuevo socio."})

        if member:
            players = Jugador.objects.filter(socio=member)
            if self.instance is not None:
                players = players.exclude(pk=self.instance.pk)
            if players.exists():
                raise serializers.ValidationError({"socio": "Este socio ya tiene un jugador asociado."})

        if new_member and self.instance is None:
            person_data = new_member.get('persona', {})
            dni = person_data.get('dni')
            if dni:
                person = Persona.objects.filter(dni=dni).first()
                if person and hasattr(person, 'socio') and hasattr(person.socio, 'jugador'):
                    raise serializers.ValidationError({"nuevo_socio": "La persona con este DNI ya tiene un socio registrado como jugador."})

        for contact in attrs.get('contactos_emergencia', []):
            person_data = contact.get('persona', {})
            phone = person_data.get('telefono')
            if not phone:
                raise serializers.ValidationError({'contactos_emergencia': 'El teléfono es obligatorio para los contactos de emergencia.'})

            dni = person_data.get('dni')
            if not dni:
                continue

            contact_id = contact.get('contacto_emergencia_id')

            if not contact_id and self.instance:
                if self.instance.contactos_emergencia.filter(persona__dni=dni).exists():
                    raise serializers.ValidationError({'contactos_emergencia': 'Esta persona ya es contacto de emergencia de este jugador.'})

            people = Persona.objects.filter(dni=dni)
            if contact_id:
                try:
                    people = people.exclude(pk=ContactoEmergencia.objects.get(pk=contact_id).persona_id)
                except ContactoEmergencia.DoesNotExist:
                    raise serializers.ValidationError({'contactos_emergencia': 'El contacto indicado no pertenece al jugador.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        new_member_data = validated_data.pop("nuevo_socio", None)
        if new_member_data:
            member_serializer = SocioSerializer()
            member = member_serializer.create(new_member_data)
            validated_data["socio"] = member

        if not validated_data.get("categoria"):
            from .models import get_default_categoria
            validated_data.pop("categoria", None)
            validated_data["categoria_id"] = get_default_categoria()

        if not validated_data.get("estado"):
            from .models import get_default_estado_deportivo
            validated_data.pop("estado", None)
            validated_data["estado_id"] = get_default_estado_deportivo()

        contacts_data = validated_data.pop("contactos_emergencia", [])
        player = Jugador.objects.create(**validated_data)
        for contact_data in contacts_data:
            contact_data["jugador"] = player
            ContactoEmergenciaSerializer().create(contact_data)
        return player

    @transaction.atomic
    def update(self, instance, validated_data):
        new_member_data = validated_data.pop("nuevo_socio", None)
        if new_member_data:
            member_serializer = SocioSerializer()
            if hasattr(instance, 'socio') and instance.socio:
                member = member_serializer.update(instance.socio, new_member_data)
            else:
                member = member_serializer.create(new_member_data)
            validated_data["socio"] = member

        contacts_data = validated_data.pop("contactos_emergencia", None)
        player = super().update(instance, validated_data)
        if contacts_data is not None:
            contact_ids = set()
            for contact_data in contacts_data:
                contact_id = contact_data.get("contacto_emergencia_id")
                contact_data["jugador"] = player
                if contact_id:
                    contact = instance.contactos_emergencia.get(pk=contact_id)
                    ContactoEmergenciaSerializer().update(contact, contact_data)
                    contact_ids.add(contact_id)
                else:
                    new_contact = ContactoEmergenciaSerializer().create(contact_data)
                    contact_ids.add(new_contact.pk)
            instance.contactos_emergencia.exclude(pk__in=contact_ids).delete()
        return player


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

    def get_contactos_emergencia(self, player):
        return ContactoEmergenciaSerializer(player.contactos_emergencia.select_related("persona"), many=True).data

    class Meta:
        model = Jugador
        fields = ["jugador_id", "socio", "categoria", "obra_social", "tallaIndumentaria", "contactos_emergencia", "estado"]
        read_only_fields = ["jugador_id"]


class DocenteSerializer(serializers.ModelSerializer):
    persona = serializers.PrimaryKeyRelatedField(queryset=Persona.objects.all())
    persona_detalle = PersonaSerializer(source="persona", read_only=True)

    class Meta:
        model = Docente
        fields = ["docente_id", "persona", "persona_detalle", "legajo", "fecha_ingreso"]
        read_only_fields = ["docente_id"]

class DocenteCategoriaSerializer(serializers.ModelSerializer):
    docente = DocenteSerializer(read_only=True)
    categoria = CategoriaSerializer(read_only=True)
    docente_id = serializers.PrimaryKeyRelatedField(
        source="docente",
        queryset=Docente.objects.all(),
        write_only=True,
        required=True,
    )
    categoria_id = serializers.PrimaryKeyRelatedField(
        source="categoria",
        queryset=Categoria.objects.all(),
        write_only=True,
        required=True,
    )

    class Meta:
        model = DocenteCategoria
        fields = ["docente_categoria_id", "docente", "categoria", "docente_id", "categoria_id"]
        read_only_fields = ["docente_categoria_id"]
