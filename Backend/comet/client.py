import logging
import time
import uuid

import requests
from requests import RequestException

from .config import MODE_MOCK, CometConfig
from .exceptions import CometAuthError, CometError, CometValidationError

logger = logging.getLogger(__name__)


class CometClient:
    """Cliente HTTP real. Todos los TODOs de spec viven acá."""

    def __init__(self, config: CometConfig | None = None):
        self.config = config or CometConfig.from_settings()

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.config.base_url}/{path.lstrip('/')}"
        logger.info("COMET[%s] %s %s", self.config.mode, method, url)
        try:
            response = requests.request(
                method, url, headers=self._headers(),
                timeout=self.config.timeout, **kwargs,
            )
        except RequestException as exc:
            raise CometError(f"Error de red al contactar COMET: {exc}") from exc

        if response.status_code == 401:
            raise CometAuthError("Credenciales de COMET inválidas.")
        if response.status_code in (400, 422):
            raise CometValidationError(response.text)
        if not response.ok:
            raise CometError(f"COMET respondió {response.status_code}: {response.text}")
        return response.json() if response.content else {}

    def crear_jugador(self, payload: dict) -> dict:
        return self._request("POST", "/api/players", json=payload)

    def actualizar_jugador(self, documento: str, payload: dict) -> dict:
        return self._request("PUT", f"/api/players/{documento}", json=payload)

    def consultar_jugador(self, documento: str) -> dict:
        return self._request("GET", f"/api/players/{documento}")

    def ping(self) -> bool:
        try:
            self._request("GET", "/api/ping")
            return True
        except CometError:
            return False


class MockCometClient:
    """
    Cliente falso para desarrollo. No pega a COMET.

    Devuelve respuestas determinísticas para que el frontend y los flujos
    internos se puedan probar end-to-end sin credenciales ni red.
    """

    def __init__(self, config: CometConfig | None = None):
        self.config = config or CometConfig.from_settings()
        self._log()

    def _log(self):
        logger.warning(
            "CometClient en modo MOCK: las llamadas NO salen a COMET. "
            "No usar en producción."
        )

    def _fake_id(self, prefix: str) -> str:
        return f"{prefix}-{uuid.uuid4().hex[:8]}"

    def crear_jugador(self, payload: dict) -> dict:
        logger.info("COMET[mock] crear_jugador(%s)", payload.get("documento"))
        return {
            "id": self._fake_id("mock"),
            "documento": payload.get("documento"),
            "estado": "creado",
            "modo": "mock",
        }

    def actualizar_jugador(self, documento: str, payload: dict) -> dict:
        logger.info("COMET[mock] actualizar_jugador(%s)", documento)
        return {
            "id": self._fake_id("mock"),
            "documento": documento,
            "estado": "actualizado",
            "modo": "mock",
        }

    def consultar_jugador(self, documento: str) -> dict:
        logger.info("COMET[mock] consultar_jugador(%s)", documento)
        return {
            "id": self._fake_id("mock"),
            "documento": documento,
            "estado": "existente",
            "modo": "mock",
        }

    def ping(self) -> bool:
        return True


def get_comet_client() -> CometClient | MockCometClient:
    """Factory: elige el cliente según COMET_MODE."""
    config = CometConfig.from_settings()
    if config.mode == MODE_MOCK:
        return MockCometClient(config)
    return CometClient(config)