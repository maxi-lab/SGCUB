from django.test import TestCase

from .models import CanalNotificacion, EstadoNotificacion


class NotificacionEnumTest(TestCase):
    def test_canales_esperados(self):
        self.assertEqual(CanalNotificacion.values, ["WHATSAPP", "MAIL"])

    def test_estados_esperados(self):
        self.assertEqual(
            EstadoNotificacion.values,
            ["ENVIADA", "PROGRAMADA", "FALLIDA"],
        )
