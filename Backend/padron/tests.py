from rest_framework import status
from rest_framework.test import APITestCase

from .models import Categoria, Docente, Jugador, Persona, Socio


class PadronViewTests(APITestCase):
    def setUp(self):
        self.persona_data = {
            "nombre": "Juan",
            "apellido": "Perez",
            "dni": "12345678",
        }
        self.socio_data = {
            "nombre": "Ana",
            "apellido": "Lopez",
            "telefono": "123456789",
        }
        self.categoria_data = {"nombre": "Inferior"}
        self.docente_data = {"legajo": 1001}

    # ------------------------------------------------------------------
    # Helpers para crear vía API (usados en los tests que prueban POST)
    # ------------------------------------------------------------------
    def create_persona(self, data=None):
        return self.client.post(
            "/api/padron/persona/", data if data is not None else self.persona_data, format="json"
        )

    def create_socio(self, data=None):
        return self.client.post(
            "/api/padron/socio/", data if data is not None else self.socio_data, format="json"
        )

    def create_categoria(self, data=None):
        return self.client.post(
            "/api/padron/categoria/", data if data is not None else self.categoria_data, format="json"
        )

    def create_jugador(self, socio_id, categoria_id):
        return self.client.post(
            "/api/padron/jugador/",
            {"socio": socio_id, "categoria": categoria_id},
            format="json",
        )

    def create_docente(self, persona_id, jugador_id, legajo=None):
        return self.client.post(
            "/api/padron/docente/",
            {"persona": persona_id, "jugador": jugador_id, "legajo": legajo or self.docente_data["legajo"]},
            format="json",
        )

    # ------------------------------------------------------------------
    # Helpers para crear directo vía ORM (usados para armar el estado
    # previo en tests de GET/PUT/PATCH/DELETE, sin depender del POST)
    # ------------------------------------------------------------------
    def crear_persona_orm(self, **kwargs):
        data = {**self.persona_data, **kwargs}
        return Persona.objects.create(**data)

    def crear_socio_orm(self, **kwargs):
        data = {**self.socio_data, **kwargs}
        return Socio.objects.create(**data)

    def crear_categoria_orm(self, **kwargs):
        data = {**self.categoria_data, **kwargs}
        return Categoria.objects.create(**data)

    def crear_jugador_orm(self, socio=None, categoria=None):
        socio = socio or self.crear_socio_orm()
        categoria = categoria or self.crear_categoria_orm()
        return Jugador.objects.create(socio=socio, categoria=categoria)

    def crear_docente_orm(self, persona=None, jugador=None, legajo=None):
        persona = persona or self.crear_persona_orm()
        jugador = jugador or self.crear_jugador_orm()
        return Docente.objects.create(
            persona=persona, jugador=jugador, legajo=legajo or self.docente_data["legajo"]
        )

    # ==================================================================
    # PERSONA
    # ==================================================================
    def test_persona_post(self):
        response = self.create_persona()
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        self.assertEqual(self.persona_data["dni"], response.data["dni"])
        self.assertIn("persona_id", response.data)

    def test_persona_post_dni_duplicado(self):
        self.crear_persona_orm()
        response = self.create_persona()
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("dni", response.data)

    def test_persona_post_campo_faltante(self):
        data = {"nombre": "Juan", "apellido": "Perez"}  # falta dni
        response = self.create_persona(data)
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("dni", response.data)

    def test_persona_get_list(self):
        self.crear_persona_orm()
        response = self.client.get("/api/padron/persona/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertGreaterEqual(len(response.data), 1)

    def test_persona_get_detail(self):
        persona = self.crear_persona_orm()
        response = self.client.get(f"/api/padron/persona/{persona.persona_id}/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(persona.nombre, response.data["nombre"])

    def test_persona_get_detail_no_existe(self):
        response = self.client.get("/api/padron/persona/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_persona_put(self):
        persona = self.crear_persona_orm()
        payload = {"nombre": "Juan Carlos", "apellido": "Perez", "dni": persona.dni}
        response = self.client.put(f"/api/padron/persona/{persona.persona_id}/", payload, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("Juan Carlos", response.data["nombre"])

    def test_persona_patch(self):
        persona = self.crear_persona_orm()
        response = self.client.put(
            f"/api/padron/persona/{persona.persona_id}/", {"nombre": "Juancito"}, format="json"
        )
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("Juancito", response.data["nombre"])
        self.assertEqual(persona.apellido, response.data["apellido"])

    def test_persona_put_no_existe(self):
        payload = {"nombre": "X", "apellido": "Y", "dni": "99999999"}
        response = self.client.put("/api/padron/persona/9999/", payload, format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_persona_delete(self):
        persona = self.crear_persona_orm()
        response = self.client.delete(f"/api/padron/persona/{persona.persona_id}/", format="json")
        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)
        self.assertEqual(
            status.HTTP_404_NOT_FOUND,
            self.client.get(f"/api/padron/persona/{persona.persona_id}/", format="json").status_code,
        )

    def test_persona_delete_no_existe(self):
        response = self.client.delete("/api/padron/persona/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    # ==================================================================
    # SOCIO
    # ==================================================================
    def test_socio_post(self):
        response = self.create_socio()
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        self.assertEqual(self.socio_data["nombre"], response.data["nombre"])
        self.assertIn("socio_id", response.data)

    def test_socio_post_campo_faltante(self):
        response = self.create_socio({"apellido": "Lopez", "telefono": "123456789"})  # falta nombre
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)

    def test_socio_get_list(self):
        self.crear_socio_orm()
        response = self.client.get("/api/padron/socio/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertGreaterEqual(len(response.data), 1)

    def test_socio_get_detail(self):
        socio = self.crear_socio_orm()
        response = self.client.get(f"/api/padron/socio/{socio.socio_id}/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(socio.nombre, response.data["nombre"])

    def test_socio_get_detail_no_existe(self):
        response = self.client.get("/api/padron/socio/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_socio_put(self):
        socio = self.crear_socio_orm()
        payload = {"nombre": "Ana Maria", "apellido": "Lopez", "telefono": "987654321"}
        response = self.client.put(f"/api/padron/socio/{socio.socio_id}/", payload, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("Ana Maria", response.data["nombre"])

    def test_socio_patch(self):
        socio = self.crear_socio_orm()
        response = self.client.put(
            f"/api/padron/socio/{socio.socio_id}/", {"telefono": "555555"}, format="json"
        )
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("555555", response.data["telefono"])

    def test_socio_delete(self):
        socio = self.crear_socio_orm()
        response = self.client.delete(f"/api/padron/socio/{socio.socio_id}/", format="json")
        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)
        self.assertEqual(
            status.HTTP_404_NOT_FOUND,
            self.client.get(f"/api/padron/socio/{socio.socio_id}/", format="json").status_code,
        )

    def test_socio_delete_no_existe(self):
        response = self.client.delete("/api/padron/socio/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    # ==================================================================
    # CATEGORIA
    # ==================================================================
    def test_categoria_post(self):
        response = self.create_categoria()
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        self.assertEqual(self.categoria_data["nombre"], response.data["nombre"])
        self.assertIn("categoria_id", response.data)

    def test_categoria_post_campo_faltante(self):
        response = self.create_categoria({})
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)

    def test_categoria_get_list(self):
        self.crear_categoria_orm()
        response = self.client.get("/api/padron/categoria/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertGreaterEqual(len(response.data), 1)

    def test_categoria_get_detail(self):
        categoria = self.crear_categoria_orm()
        response = self.client.get(f"/api/padron/categoria/{categoria.categoria_id}/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(categoria.nombre, response.data["nombre"])

    def test_categoria_get_detail_no_existe(self):
        response = self.client.get("/api/padron/categoria/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_categoria_put(self):
        categoria = self.crear_categoria_orm()
        payload = {"nombre": "Superior"}
        response = self.client.put(f"/api/padron/categoria/{categoria.categoria_id}/", payload, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("Superior", response.data["nombre"])

    def test_categoria_delete(self):
        categoria = self.crear_categoria_orm()
        response = self.client.delete(f"/api/padron/categoria/{categoria.categoria_id}/", format="json")
        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)
        self.assertEqual(
            status.HTTP_404_NOT_FOUND,
            self.client.get(f"/api/padron/categoria/{categoria.categoria_id}/", format="json").status_code,
        )

    def test_categoria_delete_no_existe(self):
        response = self.client.delete("/api/padron/categoria/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    # ==================================================================
    # JUGADOR
    # ==================================================================
    def test_jugador_post(self):
        socio = self.crear_socio_orm()
        categoria = self.crear_categoria_orm()
        response = self.create_jugador(socio.socio_id, categoria.categoria_id)
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        self.assertEqual(socio.socio_id, response.data["socio"])
        self.assertEqual(categoria.categoria_id, response.data["categoria"])
        self.assertIn("jugador_id", response.data)

    def test_jugador_post_socio_inexistente(self):
        categoria = self.crear_categoria_orm()
        response = self.create_jugador(9999, categoria.categoria_id)
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)

    def test_jugador_post_categoria_inexistente(self):
        socio = self.crear_socio_orm()
        response = self.create_jugador(socio.socio_id, 9999)
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)

    def test_jugador_get_list(self):
        self.crear_jugador_orm()
        response = self.client.get("/api/padron/jugador/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertGreaterEqual(len(response.data), 1)

    def test_jugador_get_detail(self):
        jugador = self.crear_jugador_orm()
        response = self.client.get(f"/api/padron/jugador/{jugador.jugador_id}/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(jugador.socio.socio_id, response.data["socio"])

    def test_jugador_get_detail_no_existe(self):
        response = self.client.get("/api/padron/jugador/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_jugador_put(self):
        jugador = self.crear_jugador_orm()
        otra_categoria = self.crear_categoria_orm(nombre="Superior")
        payload = {"socio": jugador.socio.socio_id, "categoria": otra_categoria.categoria_id}
        response = self.client.put(f"/api/padron/jugador/{jugador.jugador_id}/", payload, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(otra_categoria.categoria_id, response.data["categoria"])

    def test_jugador_delete(self):
        jugador = self.crear_jugador_orm()
        response = self.client.delete(f"/api/padron/jugador/{jugador.jugador_id}/", format="json")
        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)
        self.assertEqual(
            status.HTTP_404_NOT_FOUND,
            self.client.get(f"/api/padron/jugador/{jugador.jugador_id}/", format="json").status_code,
        )

    def test_jugador_delete_no_existe(self):
        response = self.client.delete("/api/padron/jugador/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    # ==================================================================
    # DOCENTE
    # ==================================================================
    def test_docente_post(self):
        persona = self.crear_persona_orm()
        jugador = self.crear_jugador_orm()
        response = self.create_docente(persona.persona_id, jugador.jugador_id)
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        self.assertEqual(self.docente_data["legajo"], response.data["legajo"])
        self.assertIn("docente_id", response.data)

    def test_docente_post_persona_inexistente(self):
        jugador = self.crear_jugador_orm()
        response = self.create_docente(9999, jugador.jugador_id)
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)

    def test_docente_get_list(self):
        self.crear_docente_orm()
        response = self.client.get("/api/padron/docente/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertGreaterEqual(len(response.data), 1)

    def test_docente_get_detail(self):
        docente = self.crear_docente_orm()
        response = self.client.get(f"/api/padron/docente/{docente.docente_id}/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(docente.legajo, response.data["legajo"])

    def test_docente_get_detail_no_existe(self):
        response = self.client.get("/api/padron/docente/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_docente_put(self):
        docente = self.crear_docente_orm()
        payload = {
            "persona": docente.persona.persona_id,
            "jugador": docente.jugador.jugador_id,
            "legajo": 2002,
        }
        response = self.client.put(f"/api/padron/docente/{docente.docente_id}/", payload, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(2002, response.data["legajo"])

    def test_docente_patch(self):
        docente = self.crear_docente_orm()
        response = self.client.put(
            f"/api/padron/docente/{docente.docente_id}/", {"legajo": 3003}, format="json"
        )
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(3003, response.data["legajo"])

    def test_docente_delete(self):
        docente = self.crear_docente_orm()
        response = self.client.delete(f"/api/padron/docente/{docente.docente_id}/", format="json")
        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)
        self.assertEqual(
            status.HTTP_404_NOT_FOUND,
            self.client.get(f"/api/padron/docente/{docente.docente_id}/", format="json").status_code,
        )

    def test_docente_delete_no_existe(self):
        response = self.client.delete("/api/padron/docente/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)