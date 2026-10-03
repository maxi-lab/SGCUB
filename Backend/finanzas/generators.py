from decimal import Decimal

from padron.models import ESTADO_ADMINISTRATIVO_ACTIVO, ESTADO_DEPORTIVO_ACTIVO

from .models import ConceptoItemChoices, ItemCuota

SOCIAL_FEE_AMOUNT = Decimal("1000.00")
SPORTS_FEE_AMOUNT = Decimal("1500.00")


class GeneradorItemsCuota:
    def __init__(self, socio, application_date):
        self.socio = socio
        self.application_date = application_date

    def build_items(self):
        if not self._is_member_active():
            return []

        items = [self._item(ConceptoItemChoices.CUOTA_SOCIAL, SOCIAL_FEE_AMOUNT)]
        if self._is_player_active():
            items.append(self._item(ConceptoItemChoices.CUOTA_DEPORTIVA, SPORTS_FEE_AMOUNT))
        items.extend(self._benefit_items(items))
        return items

    def _is_member_active(self):
        return self.socio.estado_administrativo.nombre.casefold() == ESTADO_ADMINISTRATIVO_ACTIVO.casefold()

    def _is_player_active(self):
        player = getattr(self.socio, "jugador", None)
        return player is not None and player.estado.nombre.casefold() == ESTADO_DEPORTIVO_ACTIVO.casefold()

    def _benefit_items(self, items):
        return []

    def _item(self, concept, amount, is_discount=False, reason=""):
        return ItemCuota(
            concepto=concept,
            es_descuento=is_discount,
            fecha_aplicacion=self.application_date,
            monto=amount,
            motivo=reason,
        )
