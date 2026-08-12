from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Persona, Socio, Categoria, Jugador, Docente
from .serializers import (
    PersonaSerializer,
    SocioSerializer,
    CategoriaSerializer,
    JugadorSerializer,
    DocenteSerializer,
)


@api_view(["GET", "POST"])
def persona_list_create(request):
    if request.method == "GET":
        personas = Persona.objects.all()
        serializer = PersonaSerializer(personas, many=True)
        return Response(serializer.data)

    serializer = PersonaSerializer(data=request.data)
    if serializer.is_valid():
        persona = serializer.save()
        return Response(PersonaSerializer(persona).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


@api_view(["GET", "POST"])
def socio_list_create(request):
    if request.method == "GET":
        socios = Socio.objects.all()
        serializer = SocioSerializer(socios, many=True)
        return Response(serializer.data)

    serializer = SocioSerializer(data=request.data)
    if serializer.is_valid():
        socio = serializer.save()
        return Response(SocioSerializer(socio).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


@api_view(["GET", "POST"])
def jugador_list_create(request):
    if request.method == "GET":
        jugadores = Jugador.objects.all()
        serializer = JugadorSerializer(jugadores, many=True)
        return Response(serializer.data)

    serializer = JugadorSerializer(data=request.data)
    if serializer.is_valid():
        jugador = serializer.save()
        return Response(JugadorSerializer(jugador).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
def jugador_detail(request, pk):
    jugador = get_object_or_404(Jugador, pk=pk)

    if request.method == "GET":
        serializer = JugadorSerializer(jugador)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = JugadorSerializer(jugador, data=request.data, partial=True)
        if serializer.is_valid():
            jugador = serializer.save()
            return Response(JugadorSerializer(jugador).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PATCH":
        serializer = JugadorSerializer(jugador, data=request.data, partial=True)
        if serializer.is_valid():
            jugador = serializer.save()
            return Response(JugadorSerializer(jugador).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    jugador.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


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
