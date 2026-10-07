from django.test import TestCase

from padron.models import Persona

from .models import CanalNotificacion, EnvioNotificacion, EstadoNotificacion, Notificacion
from .serializers import EnvioNotificacionSerializer


class NotificacionEnumTest(TestCase):
    def test_canales_esperados(self):
        self.assertEqual(CanalNotificacion.values, ["WHATSAPP", "MAIL"])

    def test_estados_esperados(self):
        self.assertEqual(
            EstadoNotificacion.values,
            ["ENVIADA", "PROGRAMADA", "FALLIDA"],
        )


class EnvioNotificacionSerializerTest(TestCase):
    def setUp(self):
        self.persona = Persona.objects.create(
            nombre="Ana",
            apellido="Pérez",
            dni="12345678",
            telefono="+5491123456789",
            email="ana@example.com",
        )
        self.notificacion = Notificacion.objects.create(
            titulo="Aviso",
            contenido="Contenido",
        )

    def test_serializa_persona_y_contacto_segun_canal(self):
        envio = EnvioNotificacion.objects.create(
            notificacion=self.notificacion,
            persona=self.persona,
            canal=CanalNotificacion.MAIL,
        )

        data = EnvioNotificacionSerializer(envio).data

        self.assertEqual(data["persona"], self.persona.pk)
        self.assertEqual(data["destinatario_contacto"], self.persona.email)

    def test_valida_persona_en_el_payload(self):
        serializer = EnvioNotificacionSerializer(
            data={
                "notificacion": self.notificacion.pk,
                "persona": self.persona.pk,
                "canal": CanalNotificacion.WHATSAPP,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        envio = serializer.save()
        self.assertEqual(envio.persona, self.persona)
