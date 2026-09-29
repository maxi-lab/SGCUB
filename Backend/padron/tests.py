from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.test import APITestCase
from padron.serializers import SocioSerializer 

from datetime import date

from .models import Categoria, ContactoEmergencia, Genero, Docente, Jugador, Localidad, Persona, Socio


class PadronViewTests(APITestCase):
    def setUp(self):
        self.persona_data = {
            "nombre": "Juan",
            "apellido": "Perez",
            "dni": "12345678",
            "telefono": "123456789",
        }
        self.persona_counter = 1
        self.genero = Genero.objects.create(nombre="Masculino")
        self.localidad = Localidad.objects.create(nombre="La Plata")
        self.socio_data = {}
        self.categoria_data = {
            "nombre": "Inferior",
            "anio_vigente": 2026,
            "edad_minima": 10,
            "edad_maxima": 12,
            "genero": "M",
        }
        self.docente_data = {"legajo": 1001}

    # ------------------------------------------------------------------
    # Helpers para crear vía API (usados en los tests que prueban POST)
    # ------------------------------------------------------------------
    def datos_alta_persona(self, **kwargs):
        """Payload de alta con todos los campos obligatorios de una persona."""
        return {
            **self.persona_data,
            "email": "juan.perez@example.com",
            "fecha_nacimiento": "1990-05-10",
            "genero": self.genero.pk,
            "domicilio_calle": "Calle 7",
            "domicilio_numero": "1234",
            "domicilio_localidad": self.localidad.pk,
            **kwargs,
        }

    def create_persona(self, data=None):
        return self.client.post(
            "/api/padron/persona/", data if data is not None else self.datos_alta_persona(), format="json"
        )

    def create_socio(self, data=None):
        payload = data if data is not None else {**self.datos_alta_persona(), **self.socio_data}
        return self.client.post("/api/padron/socio/", payload, format="json")

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

    def create_docente(self, persona_id, legajo=None):
        return self.client.post(
            "/api/padron/docente/",
            {"persona": persona_id, "legajo": legajo or self.docente_data["legajo"]},
            format="json",
        )

    # ------------------------------------------------------------------
    # Helpers para crear directo vía ORM (usados para armar el estado
    # previo en tests de GET/PUT/PATCH/DELETE, sin depender del POST)
    # ------------------------------------------------------------------
    def crear_persona_orm(self, **kwargs):
        data = {**self.persona_data, **kwargs}
        if "dni" not in kwargs:
            if Persona.objects.filter(dni=data["dni"]).exists():
                while Persona.objects.filter(dni=data["dni"]).exists():
                    data["dni"] = f"1234567{self.persona_counter}"
                    self.persona_counter += 1
        return Persona.objects.create(**data)

    def crear_socio_orm(self, persona=None, **kwargs):
        persona = persona or self.crear_persona_orm()
        data = {"persona": persona, **self.socio_data, **kwargs}
        return Socio.objects.create(**data)

    def crear_categoria_orm(self, **kwargs):
        data = {**self.categoria_data, **kwargs}
        return Categoria.objects.create(**data)

    def crear_jugador_orm(self, socio=None, categoria=None):
        socio = socio or self.crear_socio_orm()
        categoria = categoria or self.crear_categoria_orm()
        return Jugador.objects.create(socio=socio, categoria=categoria)

    def crear_docente_orm(self, persona=None, legajo=None):
        persona = persona or self.crear_persona_orm()
        return Docente.objects.create(
            persona=persona, legajo=legajo or self.docente_data["legajo"]
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
        data = {"nombre": "Juan", "apellido": "Perez"}
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
        response = self.client.patch(
            f"/api/padron/persona/{persona.persona_id}/", {"nombre": "Juancito"}, format="json"
        )
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("Juancito", response.data["nombre"])
        self.assertEqual(persona.apellido, response.data["apellido"])

    def test_persona_put_no_existe(self):
        payload = {"nombre": "X", "apellido": "Y", "dni": "99999999"}
        response = self.client.put("/api/padron/persona/9999/", payload, format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_persona_delete_no_permitido(self):
        persona = self.crear_persona_orm()
        response = self.client.delete(f"/api/padron/persona/{persona.persona_id}/", format="json")
        self.assertEqual(status.HTTP_405_METHOD_NOT_ALLOWED, response.status_code)
        self.assertTrue(Persona.objects.filter(pk=persona.pk).exists())

    def test_persona_con_perfil_no_se_puede_borrar(self):
        socio = self.crear_socio_orm()
        with self.assertRaises(ProtectedError):
            socio.persona.delete()

    def test_persona_post_campos_obligatorios(self):
        response = self.create_persona({"nombre": "Juan", "apellido": "Perez", "dni": "12345678"})
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        for campo in ("telefono", "email", "fecha_nacimiento", "genero",
                      "domicilio_calle", "domicilio_numero", "domicilio_localidad"):
            self.assertIn(campo, response.data)

    def test_persona_post_dni_formato_invalido(self):
        for dni in ("123456", "123456789", "12.345.678", "abcdefg"):
            response = self.create_persona(self.datos_alta_persona(dni=dni))
            self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code, dni)
            self.assertIn("dni", response.data)

    def test_persona_post_dni_7_digitos(self):
        response = self.create_persona(self.datos_alta_persona(dni="1234567"))
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)

    def test_persona_post_email_invalido(self):
        response = self.create_persona(self.datos_alta_persona(email="no-es-un-email"))
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("email", response.data)

    def test_persona_post_email_duplicado(self):
        self.crear_persona_orm(dni="11111111", email="juan.perez@example.com")
        response = self.create_persona()
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)

    def test_persona_post_dni_duplicado_informa_ficha(self):
        socio = self.crear_socio_orm()
        response = self.create_persona(self.datos_alta_persona(dni=socio.persona.dni))
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEqual(str(socio.persona.pk), response.data["persona_existente"]["persona_id"])
        self.assertNotIn("docente_id", response.data["persona_existente"])
        self.assertEqual(str(socio.pk), response.data["persona_existente"]["socio_id"])

    def test_persona_patch_dni_de_otra_persona(self):
        persona = self.crear_persona_orm()
        otra = self.crear_persona_orm(dni="22222222")
        response = self.client.patch(
            f"/api/padron/persona/{persona.persona_id}/", {"dni": otra.dni}, format="json"
        )
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("dni", response.data)

    def test_persona_patch_no_permite_vaciar_obligatorio(self):
        persona = self.crear_persona_orm()
        response = self.client.patch(
            f"/api/padron/persona/{persona.persona_id}/", {"nombre": ""}, format="json"
        )
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("nombre", response.data)

    def test_persona_edad(self):
        hoy = date.today()
        persona = self.crear_persona_orm(fecha_nacimiento=date(hoy.year - 20, 1, 1))
        self.assertEqual(20, persona.edad)
        persona.fecha_nacimiento = date(hoy.year - 20, 12, 31)
        self.assertEqual(20 if (hoy.month, hoy.day) == (12, 31) else 19, persona.edad)
        response = self.client.get(f"/api/padron/persona/{persona.persona_id}/", format="json")
        self.assertEqual(20, response.data["edad"])

    def test_persona_edad_sin_fecha_nacimiento(self):
        self.assertIsNone(self.crear_persona_orm().edad)

    def test_persona_busqueda(self):
        self.crear_persona_orm(nombre="Juan", apellido="Perez", dni="30111222")
        self.crear_persona_orm(nombre="Maria", apellido="Gomez", dni="40111222")
        self.crear_persona_orm(nombre="Juana", apellido="Gomez", dni="50111222")

        def buscar(q):
            response = self.client.get("/api/padron/persona/", {"q": q})
            self.assertEqual(status.HTTP_200_OK, response.status_code)
            return sorted(p["dni"] for p in response.data)

        self.assertEqual(["30111222", "50111222"], buscar("juan"))
        self.assertEqual(["40111222", "50111222"], buscar("GOMEZ"))
        self.assertEqual(["40111222"], buscar("4011"))
        self.assertEqual(["50111222"], buscar("juana gomez"))

    def test_contacto_emergencia_no_exige_datos_de_alta(self):
        socio = self.crear_socio_orm()
        jugador = Jugador.objects.create(socio=socio)
        response = self.client.post("/api/padron/contacto-emergencia/", {
            "jugador": jugador.pk,
            "relacion": "Madre",
            "persona": {"dni": "33444555", "nombre": "Ana", "apellido": "Perez", "telefono": "221555"},
        }, format="json")
        self.assertEqual(status.HTTP_201_CREATED, response.status_code, response.data)
        self.assertTrue(ContactoEmergencia.objects.filter(persona__dni="33444555").exists())

    # ==================================================================
    # SOCIO
    # ==================================================================
    def test_socio_post(self):
        response = self.create_socio()
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        self.assertEqual(self.persona_data["nombre"], response.data["nombre"])
        self.assertEqual(self.persona_data["apellido"], response.data["apellido"])
        self.assertEqual(self.persona_data["dni"], response.data["dni"])
        self.assertEqual(self.persona_data["telefono"], response.data["telefono"])
        self.assertIn("socio_id", response.data)

    def test_socio_post_campo_faltante(self):
        response = self.create_socio(data={"telefono": "123456789"})  # falta persona
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("nombre", response.data)
        self.assertIn("apellido", response.data)
        self.assertIn("dni", response.data)

    def test_socio_post_dni_de_socio_existente_informa_ficha(self):
        socio = self.crear_socio_orm()
        response = self.create_socio(self.datos_alta_persona(dni=socio.persona.dni))
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEqual(str(socio.pk), response.data["persona_existente"]["socio_id"])

    def test_socio_post_reutiliza_persona_existente(self):
        persona = self.crear_persona_orm(dni="31222333")
        response = self.create_socio(self.datos_alta_persona(dni="31222333"))
        self.assertEqual(status.HTTP_201_CREATED, response.status_code, response.data)
        self.assertEqual(persona.pk, Socio.objects.get(pk=response.data["socio_id"]).persona_id)

    def test_socio_get_list(self):
        self.crear_socio_orm()
        response = self.client.get("/api/padron/socio/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertGreaterEqual(len(response.data), 1)

    def test_socio_get_detail(self):
        socio = self.crear_socio_orm()
        response = self.client.get(f"/api/padron/socio/{socio.socio_id}/", format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(socio.persona.nombre, response.data["nombre"])
        self.assertEqual(socio.persona.apellido, response.data["apellido"])
        self.assertEqual(socio.persona.dni, response.data["dni"])

    def test_socio_get_detail_no_existe(self):
        response = self.client.get("/api/padron/socio/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_socio_put(self):
        socio = self.crear_socio_orm()
        payload = {
            "nombre": "Maria",
            "apellido": socio.persona.apellido,
            "dni": socio.persona.dni,
            "telefono": "987654321",
        }
        response = self.client.put(f"/api/padron/socio/{socio.socio_id}/", payload, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("Maria", response.data["nombre"])
        self.assertEqual("987654321", response.data["telefono"])

    def test_socio_patch(self):
        socio = self.crear_socio_orm()
        response = self.client.patch(
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
        self.assertEqual(self.categoria_data["anio_vigente"], response.data["anio_vigente"])
        self.assertEqual(self.categoria_data["edad_minima"], response.data["edad_minima"])
        self.assertEqual(self.categoria_data["edad_maxima"], response.data["edad_maxima"])
        self.assertEqual(self.categoria_data["genero"], response.data["genero"])
        self.assertIn("categoria_id", response.data)

    def test_categoria_post_campo_faltante(self):
        response = self.create_categoria({})
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("nombre", response.data)
        self.assertIn("anio_vigente", response.data)
        self.assertIn("edad_minima", response.data)
        self.assertIn("edad_maxima", response.data)
        self.assertIn("genero", response.data)

    def test_categoria_post_edad_maxima_menor_que_minima(self):
        data = {**self.categoria_data, "edad_minima": 15, "edad_maxima": 10}
        response = self.create_categoria(data)
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("edad_maxima", response.data)

    def test_categoria_post_genero_invalido(self):
        data = {**self.categoria_data, "genero": "X"}
        response = self.create_categoria(data)
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("genero", response.data)

    def test_categoria_post_edad_negativa(self):
        data = {**self.categoria_data, "edad_minima": -1}
        response = self.create_categoria(data)
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertIn("edad_minima", response.data)

    def test_categoria_post_duplicada(self):
        self.crear_categoria_orm()
        response = self.create_categoria()
        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)

    def test_categoria_post_mismo_nombre_distinto_genero(self):
        self.crear_categoria_orm()
        data = {**self.categoria_data, "genero": "F"}
        response = self.create_categoria(data)
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)

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
    # JUGADOR
    # ==================================================================
    def test_jugador_post(self):
        socio = self.crear_socio_orm()
        categoria = self.crear_categoria_orm()
        response = self.create_jugador(socio.socio_id, categoria.categoria_id)
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        self.assertEqual(socio.socio_id, response.data["socio"]["socio_id"])
        self.assertEqual(categoria.categoria_id, response.data["categoria"]["categoria_id"])
        self.assertIn("jugador_id", response.data)

    def test_jugador_post_nuevo_socio_directo(self):
        categoria = self.crear_categoria_orm()
        nuevo_socio_payload = {
            "nombre": "Mariano",
            "apellido": "Lopez",
            "dni": "99887766",
            "telefono": "221987654",
            "email": "mariano@example.com",
            "fecha_nacimiento": "2012-03-01",
            "genero": self.genero.pk,
            "domicilio_calle": "Calle 50",
            "domicilio_numero": "100",
            "domicilio_localidad": self.localidad.pk,
        }
        payload = {
            "nuevo_socio": nuevo_socio_payload,
            "categoria": categoria.categoria_id,
            "obra_social": "OSDE",
            "tallaIndumentaria": "Remera L",
        }
        response = self.client.post("/api/padron/jugador/", payload, format="json")
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        self.assertEqual("Mariano", response.data["socio"]["nombre"])
        self.assertEqual("99887766", response.data["socio"]["dni"])
        self.assertTrue(Socio.objects.filter(persona__dni="99887766").exists())
        self.assertTrue(Jugador.objects.filter(socio__persona__dni="99887766").exists())

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
        self.assertEqual(SocioSerializer(jugador.socio).data, response.data["socio"])

    def test_jugador_get_detail_no_existe(self):
        response = self.client.get("/api/padron/jugador/9999/", format="json")
        self.assertEqual(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_jugador_put(self):
        jugador = self.crear_jugador_orm()
        otra_categoria = self.crear_categoria_orm(nombre="Superior")
        payload = {"socio": jugador.socio.socio_id, "categoria": otra_categoria.categoria_id}
        response = self.client.put(f"/api/padron/jugador/{jugador.jugador_id}/", payload, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(otra_categoria.categoria_id, response.data["categoria"]["categoria_id"])

    def test_jugador_patch_with_nuevo_socio(self):
        jugador = self.crear_jugador_orm()
        payload = {
            "socio": jugador.socio.socio_id,
            "nuevo_socio": {
                "nombre": "Juan Actualizado",
                "apellido": jugador.socio.persona.apellido,
                "dni": jugador.socio.persona.dni,
                "telefono": "9999999",
                "email": "juan.actualizado@example.com",
            },
            "obra_social": "SWISS MEDICAL",
        }
        response = self.client.patch(f"/api/padron/jugador/{jugador.jugador_id}/", payload, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual("Juan Actualizado", response.data["socio"]["nombre"])
        self.assertEqual("SWISS MEDICAL", response.data["obra_social"])

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
        response = self.create_docente(persona.persona_id)
        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        self.assertEqual(self.docente_data["legajo"], response.data["legajo"])
        self.assertIn("docente_id", response.data)

    def test_docente_post_persona_inexistente(self):
        response = self.create_docente(9999)
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
        persona = self.crear_persona_orm(nombre="Maria", dni="87654321")
        payload = {
            "persona": persona.persona_id,
            "legajo": 2002,
        }
        response = self.client.put(f"/api/padron/docente/{docente.docente_id}/", payload, format="json")
        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(2002, response.data["legajo"])
        self.assertEqual(persona.persona_id, response.data["persona"])

    def test_docente_patch(self):
        docente = self.crear_docente_orm()
        response = self.client.patch(
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