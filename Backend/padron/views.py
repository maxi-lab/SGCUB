from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .services import recategorizar_jugadores
from .services import pasr_de_anio_vigente_a_categoria

from .models import CargoDocente, Persona, Socio, Categoria, Jugador, Docente, EstadoDeportivo, ContactoEmergencia, EstadoSocio, Genero, Localidad, DocenteCategoria
from .serializers import (
    CargoDocenteSerializer,
    DocenteCategoriaSerializer,
    PersonaSerializer,
    SocioSerializer,
    CategoriaSerializer,
    EstadoDeportivoSerializer,
    JugadorSerializer,
    JugadorListSerializer,
    JugadorSerializerDetail,
    DocenteSerializer,
    ContactoEmergenciaSerializer,
    EstadoSocioSerializer,
    GeneroSerializer,
    LocalidadSerializer,
    player_contacts_error,
)


@extend_schema(tags=["Padron / Genero"], request=GeneroSerializer, responses=GeneroSerializer)
@api_view(["GET"])
def genero_list(request):
    genders = Genero.objects.all()
    return Response(GeneroSerializer(genders, many=True).data)


@extend_schema(tags=["Padron / Localidad"], request=LocalidadSerializer, responses=LocalidadSerializer)
@api_view(["GET"])
def localidad_list(request):
    localities = Localidad.objects.all()
    return Response(LocalidadSerializer(localities, many=True).data)


@extend_schema(tags=["Padron / EstadoSocio"], request=EstadoSocioSerializer, responses=EstadoSocioSerializer)
@api_view(["GET"])
def estado_socio_list_create(request):
    member_statuses = EstadoSocio.objects.all()
    serializer = EstadoSocioSerializer(member_statuses, many=True)
    return Response(serializer.data)


@extend_schema(tags=["Padron / EstadoSocio"], request=EstadoSocioSerializer, responses=EstadoSocioSerializer)
@api_view(["GET"])
def estado_socio_detail(request, pk):
    member_status = get_object_or_404(EstadoSocio, pk=pk)
    serializer = EstadoSocioSerializer(member_status)
    return Response(serializer.data)


@extend_schema(tags=["Padron / Persona"], request=PersonaSerializer, responses=PersonaSerializer)
@api_view(["GET", "POST"])
def persona_list_create(request):
    if request.method == "GET":
        people = Persona.objects.select_related(
            "genero", "domicilio__localidad", "socio__jugador", "docente"
        )
        dni = request.query_params.get("dni")
        dni_prefix = request.query_params.get("dni_prefix")
        search = request.query_params.get("q", "").strip()
        if dni:
            people = people.filter(dni=dni)
        elif dni_prefix:
            people = people.filter(dni__startswith=dni_prefix).order_by("dni")[:5]
        elif search:
            for term in search.split():
                people = people.filter(
                    Q(dni__startswith=term) | Q(nombre__icontains=term) | Q(apellido__icontains=term)
                )
            people = people.order_by("apellido", "nombre")
        serializer = PersonaSerializer(people, many=True)
        return Response(serializer.data)

    serializer = PersonaSerializer(data=request.data)
    if serializer.is_valid():
        person = serializer.save()
        return Response(PersonaSerializer(person).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Persona"], request=PersonaSerializer, responses=PersonaSerializer)
@api_view(["GET", "PUT", "PATCH"])
def persona_detail(request, pk):
    person = get_object_or_404(Persona, pk=pk)

    if request.method == "GET":
        serializer = PersonaSerializer(person)
        return Response(serializer.data)

    serializer = PersonaSerializer(person, data=request.data, partial=True)
    if serializer.is_valid():
        person = serializer.save()
        return Response(PersonaSerializer(person).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Socio"], request=SocioSerializer, responses=SocioSerializer)
@api_view(["GET", "POST"])
def socio_list_create(request):
    if request.method == "GET":
        members = Socio.objects.select_related(
            "persona__genero", "persona__domicilio__localidad", "estado_socio"
        )
        serializer = SocioSerializer(members, many=True)
        return Response(serializer.data)

    serializer = SocioSerializer(data=request.data)

    if serializer.is_valid():
        member = serializer.save()
        return Response(
            SocioSerializer(member).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@extend_schema(tags=["Padron / Socio"], request=SocioSerializer, responses=SocioSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def socio_detail(request, pk):
    member = get_object_or_404(Socio, pk=pk)

    if request.method == "GET":
        serializer = SocioSerializer(member)
        return Response(serializer.data)

    if request.method == "DELETE":
        # Baja lógica: el registro se conserva con estado Inactivo
        member.deactivate()
        return Response(SocioSerializer(member).data)

    serializer = SocioSerializer(member, data=request.data, partial=True)
    if serializer.is_valid():
        member = serializer.save()
        return Response(SocioSerializer(member).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Categoria"], request=CategoriaSerializer, responses=CategoriaSerializer)
@api_view(["GET", "POST"])
def categoria_list_create(request):
    if request.method == "GET":
        categories = Categoria.objects.all()
        serializer = CategoriaSerializer(categories, many=True)
        return Response(serializer.data)

    serializer = CategoriaSerializer(data=request.data)
    if serializer.is_valid():
        category = serializer.save()
        return Response(CategoriaSerializer(category).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Categoria"], request=CategoriaSerializer, responses=CategoriaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def categoria_detail(request, pk):
    category = get_object_or_404(Categoria, pk=pk)

    if request.method == "GET":
        serializer = CategoriaSerializer(category)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = CategoriaSerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            category = serializer.save()
            return Response(CategoriaSerializer(category).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = CategoriaSerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            category = serializer.save()
            return Response(CategoriaSerializer(category).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Borrar la categoría elimina sus asignaciones docentes: no puede dejar a un docente sin cargos
    teachers_left_without_assignments = [
        str(assignment.docente.persona)
        for assignment in category.docentes_categoria.select_related("docente__persona")
        if not assignment.docente.has_assignments(exclude={"categoria": category})
    ]
    if teachers_left_without_assignments:
        return Response(
            {"detail": "No se puede eliminar: es la única categoría de " + ", ".join(teachers_left_without_assignments) + "."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    category.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / EstadoDeportivo"], request=EstadoDeportivoSerializer, responses=EstadoDeportivoSerializer)
@api_view(["GET", "POST"])
def estado_list_create(request):
    if request.method == "GET":
        sport_statuses = EstadoDeportivo.objects.all()
        serializer = EstadoDeportivoSerializer(sport_statuses, many=True)
        return Response(serializer.data)

    serializer = EstadoDeportivoSerializer(data=request.data)
    if serializer.is_valid():
        sport_status = serializer.save()
        return Response(EstadoDeportivoSerializer(sport_status).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / EstadoDeportivo"], request=EstadoDeportivoSerializer, responses=EstadoDeportivoSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def estado_detail(request, pk):
    sport_status = get_object_or_404(EstadoDeportivo, pk=pk)

    if request.method == "GET":
        serializer = EstadoDeportivoSerializer(sport_status)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = EstadoDeportivoSerializer(sport_status, data=request.data, partial=True)
        if serializer.is_valid():
            sport_status = serializer.save()
            return Response(EstadoDeportivoSerializer(sport_status).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = EstadoDeportivoSerializer(sport_status, data=request.data, partial=True)
        if serializer.is_valid():
            sport_status = serializer.save()
            return Response(EstadoDeportivoSerializer(sport_status).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    sport_status.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / Jugador"], request=JugadorSerializer, responses={200: JugadorListSerializer, 201: JugadorListSerializer})
@api_view(["GET", "POST"])
def jugador_list_create(request):
    if request.method == "GET":
        players = Jugador.objects.select_related(
            "socio__persona__genero", "socio__persona__domicilio__localidad", "socio__estado_socio",
            "categoria", "categoria_secundaria", "estado",
        ).prefetch_related("contactos_emergencia__persona")
        serializer = JugadorListSerializer(players, many=True)
        return Response(serializer.data)

    serializer = JugadorSerializer(data=request.data)
    if serializer.is_valid():
        player = serializer.save()
        return Response(JugadorSerializerDetail(player).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Jugador"], request=JugadorSerializer, responses={200: JugadorSerializerDetail, 201: JugadorSerializerDetail})
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def jugador_detail(request, pk):
    player = get_object_or_404(Jugador, pk=pk)

    if request.method == "GET":
        serializer = JugadorSerializerDetail(player)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = JugadorSerializer(player, data=request.data, partial=False)
        if serializer.is_valid():
            player = serializer.save()
            return Response(JugadorSerializerDetail(player).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = JugadorSerializer(player, data=request.data, partial=True)
        if serializer.is_valid():
            player = serializer.save()
            return Response(JugadorSerializerDetail(player).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Baja lógica: el registro se conserva con estado deportivo Inactivo
    player.deactivate()
    return Response(JugadorSerializerDetail(player).data)


@extend_schema(tags=["Padron / Docente"], request=DocenteSerializer, responses=DocenteSerializer)
@api_view(["GET", "POST"])
def docente_list_create(request):
    if request.method == "GET":
        teachers = Docente.objects.select_related(
            "persona__genero", "persona__domicilio__localidad", "persona__socio__jugador", "estado"
        ).prefetch_related("categorias_docente__cargo", "categorias_docente__categoria")
        serializer = DocenteSerializer(teachers, many=True)
        return Response(serializer.data)

    serializer = DocenteSerializer(data=request.data)
    if serializer.is_valid():
        teacher = serializer.save()
        return Response(DocenteSerializer(teacher).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Docente"], request=DocenteSerializer, responses=DocenteSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def docente_detail(request, pk):
    teacher = get_object_or_404(Docente, pk=pk)

    if request.method == "GET":
        serializer = DocenteSerializer(teacher)
        return Response(serializer.data)

    if request.method == "DELETE":
        # Baja lógica: el registro se conserva con estado Inactivo
        teacher.deactivate()
        return Response(DocenteSerializer(teacher).data)

    serializer = DocenteSerializer(teacher, data=request.data, partial=True)
    if serializer.is_valid():
        teacher = serializer.save()
        return Response(DocenteSerializer(teacher).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Docente"], responses=CargoDocenteSerializer)
@api_view(["GET"])
def cargo_docente_list(request):
    positions = CargoDocente.objects.order_by("nombre")
    return Response(CargoDocenteSerializer(positions, many=True).data)


@extend_schema(tags=["Padron / ContactoEmergencia"], request=ContactoEmergenciaSerializer, responses=ContactoEmergenciaSerializer)
@api_view(["GET", "POST"])
def contacto_emergencia_list_create(request):
    if request.method == "GET":
        contacts = ContactoEmergencia.objects.select_related(
            "persona",
            "jugador",
        )

        serializer = ContactoEmergenciaSerializer(contacts, many=True)
        return Response(serializer.data)

    serializer = ContactoEmergenciaSerializer(data=request.data)

    if serializer.is_valid():
        contact = serializer.save()

        return Response(
            ContactoEmergenciaSerializer(contact).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@extend_schema(tags=["Padron / ContactoEmergencia"], request=ContactoEmergenciaSerializer, responses=ContactoEmergenciaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def contacto_emergencia_detail(request, pk):
    contact = get_object_or_404(
        ContactoEmergencia.objects.select_related("persona", "jugador"),
        pk=pk,
    )

    if request.method == "GET":
        serializer = ContactoEmergenciaSerializer(contact)
        return Response(serializer.data)

    if request.method in ["PUT", "PATCH"]:
        serializer = ContactoEmergenciaSerializer(
            contact,
            data=request.data,
            partial=request.method == "PATCH",
        )

        if serializer.is_valid():
            contact = serializer.save()
            return Response(ContactoEmergenciaSerializer(contact).data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    player = contact.jugador
    remaining_flags = list(
        player.contactos_emergencia.exclude(pk=contact.pk).values_list("responsable_legal", flat=True)
    )
    error = player_contacts_error(player.socio.persona.fecha_nacimiento, remaining_flags)
    if error:
        return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
    contact.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / Jugador"], summary="Recategorizar jugadores")
@api_view(["POST"])
def recategorize_players_view(request):
    recategorizar_jugadores()
    return Response({"message": "Recategorización de jugadores completada."}, status=status.HTTP_200_OK)


@extend_schema(tags=["Padron / Categoria"], summary="Actualizar año vigente de categorías")
@api_view(["POST"])
def update_categories_current_year_view(request):
    pasr_de_anio_vigente_a_categoria()
    return Response({"message": "Año vigente de categorías actualizado."}, status=status.HTTP_200_OK)


@extend_schema(tags=["Padron / DocenteCategoria"], request=DocenteCategoriaSerializer, responses=DocenteCategoriaSerializer)
@api_view(["GET", "POST"])
def docente_categoria_list(request):
    if request.method == "POST":
        serializer = DocenteCategoriaSerializer(data=request.data)
        if serializer.is_valid():
            teacher_category = serializer.save()
            return Response(
                DocenteCategoriaSerializer(teacher_category).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    teacher_categories = DocenteCategoria.objects.select_related("docente", "categoria", "cargo")

    teacher_id = (
        request.query_params.get("idDocente")
        or request.query_params.get("docente_id")
        or request.query_params.get("docente")
    )
    category_id = (
        request.query_params.get("idCategoria")
        or request.query_params.get("categoria_id")
        or request.query_params.get("categoria")
    )

    if teacher_id:
        teacher_categories = teacher_categories.filter(docente_id=teacher_id)
    if category_id:
        teacher_categories = teacher_categories.filter(categoria_id=category_id)

    serializer = DocenteCategoriaSerializer(teacher_categories, many=True)
    return Response(serializer.data)


@extend_schema(tags=["Padron / DocenteCategoria"], responses=DocenteCategoriaSerializer)
@api_view(["GET", "DELETE"])
def docente_categoria_detail(request, pk):
    teacher_category = get_object_or_404(
        DocenteCategoria.objects.select_related("docente", "categoria", "cargo"),
        pk=pk,
    )
    if request.method == "DELETE":
        if not teacher_category.docente.has_assignments(exclude={"pk": teacher_category.pk}):
            return Response(
                {"detail": "Es la única categoría del docente: debe tener al menos un cargo con una categoría."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        teacher_category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = DocenteCategoriaSerializer(teacher_category)
    return Response(serializer.data)


@extend_schema(tags=["Padron / DocenteCategoria"], request=DocenteCategoriaSerializer, responses=DocenteCategoriaSerializer)
@api_view(["POST"])
def docente_categoria_create(request):
    serializer = DocenteCategoriaSerializer(data=request.data)
    if serializer.is_valid():
        teacher_category = serializer.save()
        return Response(
            DocenteCategoriaSerializer(teacher_category).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
