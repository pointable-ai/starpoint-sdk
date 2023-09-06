import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

import requests

from starpoint._utils import (
    _build_header,
    _check_collection_identifier_collision,
    _validate_host,
)
from starpoint.enums import EmbeddingModel


LOGGER = logging.getLogger(__name__)

# Host
EMBEDDING_URL = "https://embedding.starpoint.ai"

# Endpoints
EMBED_PATH = "/api/v1/embed"

# Error and warning messages
SSL_ERROR_MSG = "Request failed due to SSLError. Error is likely due to invalid API key. Please check if your API is correct and still valid."


class EmbeddingClient(object):
    """Client for the embedding endpoints."""

    def __init__(self, api_key: UUID, host: Optional[str] = None):
        if host is None:
            host = EMBEDDING_URL

        self.host = _validate_host(host)
        self.api_key = api_key

    def embed(
        self,
        text: List[str],
        model: EmbeddingModel,
    ) -> Dict[str, List[Dict]]:
        """Takes some text and creates an embedding against a model in starpoint.

        Args:
            text: List of strings to create embeddings from.
            model: A choice of

        Returns:
            dict: Result with multiple lists of embeddings, matching the number of requested strings to
                create embeddings from.

        Raises:
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        request_data = dict(text=text, model=model.value)
        try:
            response = requests.post(
                url=f"{self.host}{EMBED_PATH}",
                json=request_data,
                headers=_build_header(
                    api_key=self.api_key,
                    additional_headers={"Content-Type": "application/json"},
                ),
            )
        except requests.exceptions.SSLError as e:
            LOGGER.error(SSL_ERROR_MSG)
            raise

        if not response.ok:
            LOGGER.error(
                f"Request failed with status code {response.status_code} "
                f"and the following message:\n{response.text}"
            )
            return {}
        return response.json()
