import logging
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

import requests

from starpoint._utils import (
    _build_header,
    _check_collection_identifier_collision,
    _validate_host,
)


LOGGER = logging.getLogger(__name__)

# Host
EMBEDDING_URL = "https://embedding.starpoint.ai"

# Endpoints
EMBED_PATH = "/api/v1/embed"

# Error and warning messages
SSL_ERROR_MSG = "Request failed due to SSLError. Error is likely due to invalid API key. Please check if your API is correct and still valid."


class EmbeddingModel(Enum):
    MINILM = "MiniLm"


class EmbeddingClient(object):
    """Client for the embedding endpoints."""

    def __init__(self, api_key: UUID, host: Optional[str] = None):
        if host is None:
            host = EMBEDDING_URL

        self.host = _validate_host(host)
        self.api_key = api_key

    # FIXME: auto-fill the metadata field
    def embed(
        self,
        texts: List[str],
        model: EmbeddingModel,
    ) -> Dict[str, List[Dict]]:
        """Takes some texts creates embeddings using a model in starpoint. This is a
        version of embed_and_join_metadata where joining metadata with the result is
        not necessary. The same API is used between the two methods.

        Args:
            texts: List of strings to create embeddings from.
            model: An enum choice from EmbeddingModel.

        Returns:
            dict: Result with list of texts, metadata, and embeddings.

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

    def embed_and_join_metadata(
        self,
        texts: List[str],
        metadatas: List[Dict],
        model: EmbeddingModel,
    ) -> Dict[str, List[Dict]]:
        """Takes some texts and creates embeddings using a model in starpoint. Metadata is joined with
        the results for ergonomics. Under the hood this is using embed_items.

        Args:
            texts: List of strings to create embeddings from.
            metadatas: List of metadata to join to the string and embedding when the embedding operation is complete.
            model: An enum choice from EmbeddingModel.

        Returns:
            dict: Result with list of texts, metadata, and embeddings.

        Raises:
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        items = [
            {
                "text": text,
                "metadata": metadata,
            }
            for text, metadata in zip(texts, metadatas)
        ]
        return self.embed_items(items=items, model=model)

    def embed_items(
        self,
        items: List[Dict],
        model: EmbeddingModel,
    ) -> Dict[str, List[Dict]]:
        """Takes items with text and metadata, and embeds the text using a model in starpoint. Metadata is joined with
        the results for ergonomics.

        Args:
            items: List of dict where the text and metadata are paired together
            model: An enum choice from EmbeddingModel.

        Returns:
            dict: Result with list of texts, metadata, and embeddings.

        Raises:
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        request_data = dict(items=items, model=model.value)
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
