from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .services import recategorizar_jugadores
from .services import pasr_de_anio_vigente_a_categoria

from .models import Persona, Socio, Categoria, Jugador, Docente, EstadoDeportivo, ContactoEmergencia, EstadoSocio, Genero, Localidad, DocenteCategoria
from .serializers import (
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
)


@extend_schema(tags=["Padron / Genero"], request=GeneroSerializer, responses=GeneroSerializer)
@api_view(["GET"])
def genero_list(request):
    generos = Genero.objects.all()
    return Response(GeneroSerializer(generos, many=True).data)


@extend_schema(tags=["Padron / Localidad"], request=LocalidadSerializer, responses=LocalidadSerializer)
@api_view(["GET"])
def localidad_list(request):
    localidades = Localidad.objects.all()
    return Response(LocalidadSerializer(localidades, many=True).data)


@extend_schema(tags=["Padron / EstadoSocio"], request=EstadoSocioSerializer, responses=EstadoSocioSerializer)
@api_view(["GET"])
def estado_socio_list_create(request):
    estados = EstadoSocio.objects.all()
    serializer = EstadoSocioSerializer(estados, many=True)
    return Response(serializer.data)


@extend_schema(tags=["Padron / EstadoSocio"], request=EstadoSocioSerializer, responses=EstadoSocioSerializer)
@api_view(["GET"])
def estado_socio_detail(request, pk):
    estado = get_object_or_404(EstadoSocio, pk=pk)
    serializer = EstadoSocioSerializer(estado)
    return Response(serializer.data)


@extend_schema(tags=["Padron / Persona"], request=PersonaSerializer, responses=PersonaSerializer)
@api_view(["GET", "POST"])
def persona_list_create(request):
    if request.method == "GET":
        dni = request.query_params.get("dni")
        if dni:
            personas = Persona.objects.filter(dni=dni)
        else:
            personas = Persona.objects.all()
        serializer = PersonaSerializer(personas, many=True)
        return Response(serializer.data)

    serializer = PersonaSerializer(data=request.data)
    if serializer.is_valid():
        persona = serializer.save()
        return Response(PersonaSerializer(persona).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Persona"], request=PersonaSerializer, responses=PersonaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def persona_detail(request, pk):
    persona = get_object_or_404(Persona, pk=pk)

    if request.method == "GET":
        serializer = PersonaSerializer(persona)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = PersonaSerializer(persona, data=request.data, partial=True)
        if serializer.is_valid():
            persona = serializer.save()
            return Response(PersonaSerializer(persona).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = PersonaSerializer(persona, data=request.data, partial=True)
        if serializer.is_valid():
            persona = serializer.save()
            return Response(PersonaSerializer(persona).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    persona.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / Socio"], request=SocioSerializer, responses=SocioSerializer)
@api_view(["GET", "POST"])
def socio_list_create(request):
    if request.method == "GET":
        socios = Socio.objects.all()
        serializer = SocioSerializer(socios, many=True)
        return Response(serializer.data)

    serializer = SocioSerializer(data=request.data)

    if serializer.is_valid():
        socio = serializer.save()
        return Response(
            SocioSerializer(socio).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@extend_schema(tags=["Padron / Socio"], request=SocioSerializer, responses=SocioSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def socio_detail(request, pk):
    socio = get_object_or_404(Socio, pk=pk)

    if request.method == "GET":
        serializer = SocioSerializer(socio)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = SocioSerializer(socio, data=request.data, partial=True)
        if serializer.is_valid():
            socio = serializer.save()
            return Response(SocioSerializer(socio).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = SocioSerializer(socio, data=request.data, partial=True)
        if serializer.is_valid():
            socio = serializer.save()
            return Response(SocioSerializer(socio).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    socio.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / Categoria"], request=CategoriaSerializer, responses=CategoriaSerializer)
@api_view(["GET", "POST"])
def categoria_list_create(request):
    if request.method == "GET":
        categorias = Categoria.objects.all()
        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data)

    serializer = CategoriaSerializer(data=request.data)
    if serializer.is_valid():
        categoria = serializer.save()
        return Response(CategoriaSerializer(categoria).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Categoria"], request=CategoriaSerializer, responses=CategoriaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def categoria_detail(request, pk):
    categoria = get_object_or_404(Categoria, pk=pk)

    if request.method == "GET":
        serializer = CategoriaSerializer(categoria)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = CategoriaSerializer(categoria, data=request.data, partial=True)
        if serializer.is_valid():
            categoria = serializer.save()
            return Response(CategoriaSerializer(categoria).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = CategoriaSerializer(categoria, data=request.data, partial=True)
        if serializer.is_valid():
            categoria = serializer.save()
            return Response(CategoriaSerializer(categoria).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    categoria.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / EstadoDeportivo"], request=EstadoDeportivoSerializer, responses=EstadoDeportivoSerializer)
@api_view(["GET", "POST"])
def estado_list_create(request):
    if request.method == "GET":
        estados = EstadoDeportivo.objects.all()
        serializer = EstadoDeportivoSerializer(estados, many=True)
        return Response(serializer.data)

    serializer = EstadoDeportivoSerializer(data=request.data)
    if serializer.is_valid():
        estado = serializer.save()
        return Response(EstadoDeportivoSerializer(estado).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / EstadoDeportivo"], request=EstadoDeportivoSerializer, responses=EstadoDeportivoSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def estado_detail(request, pk):
    estado = get_object_or_404(EstadoDeportivo, pk=pk)

    if request.method == "GET":
        serializer = EstadoDeportivoSerializer(estado)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = EstadoDeportivoSerializer(estado, data=request.data, partial=True)
        if serializer.is_valid():
            estado = serializer.save()
            return Response(EstadoDeportivoSerializer(estado).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = EstadoDeportivoSerializer(estado, data=request.data, partial=True)
        if serializer.is_valid():
            estado = serializer.save()
            return Response(EstadoDeportivoSerializer(estado).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    estado.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / Jugador"], request=JugadorSerializer, responses={200: JugadorListSerializer, 201: JugadorListSerializer})
@api_view(["GET", "POST"])
def jugador_list_create(request):
    if request.method == "GET":
        jugadores = Jugador.objects.all()
        serializer = JugadorListSerializer(jugadores, many=True)
        return Response(serializer.data)

    serializer = JugadorSerializer(data=request.data)
    if serializer.is_valid():
        jugador = serializer.save()
        return Response(JugadorSerializerDetail(jugador).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Jugador"], request=JugadorSerializer, responses={200: JugadorSerializerDetail, 201: JugadorSerializerDetail})
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def jugador_detail(request, pk):
    jugador = get_object_or_404(Jugador, pk=pk)

    if request.method == "GET":
        serializer = JugadorSerializerDetail(jugador)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = JugadorSerializer(jugador, data=request.data, partial=False)
        if serializer.is_valid():
            jugador = serializer.save()
            return Response(JugadorSerializerDetail(jugador).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = JugadorSerializer(jugador, data=request.data, partial=True)
        if serializer.is_valid():
            jugador = serializer.save()
            return Response(JugadorSerializerDetail(jugador).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    jugador.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / Docente"], request=DocenteSerializer, responses=DocenteSerializer)
@api_view(["GET", "POST"])
def docente_list_create(request):
    if request.method == "GET":
        docentes = Docente.objects.all()
        serializer = DocenteSerializer(docentes, many=True)
        return Response(serializer.data)

    serializer = DocenteSerializer(data=request.data)
    if serializer.is_valid():
        docente = serializer.save()
        return Response(DocenteSerializer(docente).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Padron / Docente"], request=DocenteSerializer, responses=DocenteSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def docente_detail(request, pk):
    docente = get_object_or_404(Docente, pk=pk)

    if request.method == "GET":
        serializer = DocenteSerializer(docente)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = DocenteSerializer(docente, data=request.data, partial=True)
        if serializer.is_valid():
            docente = serializer.save()
            return Response(DocenteSerializer(docente).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = DocenteSerializer(docente, data=request.data, partial=True)
        if serializer.is_valid():
            docente = serializer.save()
            return Response(DocenteSerializer(docente).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    docente.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / ContactoEmergencia"], request=ContactoEmergenciaSerializer, responses=ContactoEmergenciaSerializer)
@api_view(["GET", "POST"])
def contacto_emergencia_list_create(request):
    if request.method == "GET":
        contactos = ContactoEmergencia.objects.select_related(
            "persona",
            "jugador",
        )

        serializer = ContactoEmergenciaSerializer(contactos, many=True)
        return Response(serializer.data)

    serializer = ContactoEmergenciaSerializer(data=request.data)

    if serializer.is_valid():
        contacto = serializer.save()

        return Response(
            ContactoEmergenciaSerializer(contacto).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@extend_schema(tags=["Padron / ContactoEmergencia"], request=ContactoEmergenciaSerializer, responses=ContactoEmergenciaSerializer)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
def contacto_emergencia_detail(request, pk):
    contacto = get_object_or_404(
        ContactoEmergencia.objects.select_related("persona", "jugador"),
        pk=pk,
    )

    if request.method == "GET":
        serializer = ContactoEmergenciaSerializer(contacto)
        return Response(serializer.data)

    if request.method in ["PUT", "PATCH"]:
        serializer = ContactoEmergenciaSerializer(
            contacto,
            data=request.data,
            partial=request.method == "PATCH",
        )

        if serializer.is_valid():
            contacto = serializer.save()
            return Response(ContactoEmergenciaSerializer(contacto).data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    contacto.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Padron / Jugador"], summary="Recategorizar jugadores")
@api_view(["POST"])
def recategorizar_jugadores_view(request):
    recategorizar_jugadores()
    return Response({"message": "Recategorización de jugadores completada."}, status=status.HTTP_200_OK)


@extend_schema(tags=["Padron / Categoria"], summary="Actualizar año vigente de categorías")
@api_view(["POST"])
def pasr_de_anio_vigente_a_categoria_view(request):
    pasr_de_anio_vigente_a_categoria()
    return Response({"message": "Año vigente de categorías actualizado."}, status=status.HTTP_200_OK)


@extend_schema(tags=["Padron / DocenteCategoria"], request=DocenteCategoriaSerializer, responses=DocenteCategoriaSerializer)
@api_view(["GET", "POST"])
def docente_categoria_list(request):
    if request.method == "POST":
        serializer = DocenteCategoriaSerializer(data=request.data)
        if serializer.is_valid():
            docente_categoria = serializer.save()
            return Response(
                DocenteCategoriaSerializer(docente_categoria).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    categorias = DocenteCategoria.objects.select_related("docente", "categoria")

    docente_id = (
        request.query_params.get("idDocente")
        or request.query_params.get("docente_id")
        or request.query_params.get("docente")
    )
    categoria_id = (
        request.query_params.get("idCategoria")
        or request.query_params.get("categoria_id")
        or request.query_params.get("categoria")
    )

    if docente_id:
        categorias = categorias.filter(docente_id=docente_id)
    if categoria_id:
        categorias = categorias.filter(categoria_id=categoria_id)

    serializer = DocenteCategoriaSerializer(categorias, many=True)
    return Response(serializer.data)


@extend_schema(tags=["Padron / DocenteCategoria"], responses=DocenteCategoriaSerializer)
@api_view(["GET", "DELETE"])
def docente_categoria_detail(request, pk):
    docente_categoria = get_object_or_404(
        DocenteCategoria.objects.select_related("docente", "categoria"),
        pk=pk,
    )
    if request.method == "DELETE":
        docente_categoria.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = DocenteCategoriaSerializer(docente_categoria)
    return Response(serializer.data)


@extend_schema(tags=["Padron / DocenteCategoria"], request=DocenteCategoriaSerializer, responses=DocenteCategoriaSerializer)
@api_view(["POST"])
def docente_categoria_create(request):
    serializer = DocenteCategoriaSerializer(data=request.data)
    if serializer.is_valid():
        docente_categoria = serializer.save()
        return Response(
            DocenteCategoriaSerializer(docente_categoria).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)