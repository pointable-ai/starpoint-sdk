import logging
import more_itertools
from enum import Enum
from typing import Any, Dict, Hashable, List, Optional
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
TEXT_METADATA_LENGTH_MISMATCH_WARNING = (
    "The length of the texts and metadatas provided are different. There may be a mismatch "
    "between texts and the metadatas length; this may cause undesired results between the joining of "
    "embeddings and metadatas."
)


class EmbeddingModel(Enum):
    MINILM = "MINI_LM"


class EmbeddingClient(object):
    """Client for the embedding endpoints."""

    def __init__(self, api_key: UUID, host: Optional[str] = None):
        if host is None:
            host = EMBEDDING_URL

        self.host = _validate_host(host)
        self.api_key = api_key

    def embed(
        self,
        texts: List[str],
        model: EmbeddingModel = EmbeddingModel.MINILM,
    ) -> Dict[str, List[Dict]]:
        """Takes some texts creates embeddings using a model in starpoint. This is a
        version of `embed_and_join_metadata_by_column` where joining metadata with the result is
        not necessary. The same API is used for the two methods.

        Args:
            texts: List of strings to create embeddings from.
            model: An enum choice from EmbeddingModel.

        Returns:
            dict: Result with list of texts, metadata, and embeddings.

        Raises:
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        text_embedding_items = [{"text": text, "metadata": None} for text in texts]
        return self.embed_items(text_embedding_items=text_embedding_items, model=model)

    def embed_and_join_metadata_by_columns(
        self,
        texts: List[str],
        metadatas: List[Dict],
        model: EmbeddingModel = EmbeddingModel.MINILM,
    ) -> Dict[str, List[Dict]]:
        """Takes some texts and creates embeddings using a model in starpoint. Prefer using `embed_and_join_metadata` or
        `embed_items` instead, as mismatched `texts` and `metadatas` will output undesirable results.
        Under the hood this is using `embed_items`.

        Args:
            texts: List of strings to create embeddings from.
            metadatas: List of metadata to join to the string and embedding when the embedding operation is complete.
                This metadata makes your embeddings queryable within starpoint.
            model: An enum choice from EmbeddingModel.

        Returns:
            dict: Result with list of texts, metadata, and embeddings.

        Raises:
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        if not isinstance(texts, list):
            raise ValueError("texts passed was not of type list")
        if not isinstance(metadatas, list):
            raise ValueError("metadatas passed was not of type list")

        if len(texts) != len(metadatas):
            LOGGER.warning(TEXT_METADATA_LENGTH_MISMATCH_WARNING)

        text_embedding_items = [
            {
                "text": text,
                "metadata": metadata,
            }
            for text, metadata in zip(texts, metadatas)
        ]
        return self.embed_items(text_embedding_items=text_embedding_items, model=model)

    def embed_and_join_metadata(
        self,
        text_embedding_items: List[Dict],
        embedding_key: Hashable,
        model: EmbeddingModel = EmbeddingModel.MINILM,
    ) -> Dict[str, List[Dict]]:
        """Takes some texts and creates embeddings using a model in starpoint, and joins them to
        all additional data as metadata. Under the hood this is using `embed_and_join_metadata_by_columns`
        which is using `embed_items`.

        Args:
            text_embedding_items: List of dicts of data to create embeddings from.
            embedding_key: the key in each item used to create embeddings from.
                e.g. `"context"` would be passed if each item looks like this: `{"context": "embed this text"}`
            model: An enum choice from EmbeddingModel.

        Returns:
            dict: Result with list of texts, metadata, and embeddings.

        Raises:
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        if not text_embedding_items:
            raise ValueError("text_embedding_items received an empty list.")

        texts = list(map(lambda item: item.get(embedding_key), text_embedding_items))
        if not all(texts):
            unqualified_indices = list(
                more_itertools.locate(texts, lambda x: x is None)
            )
            raise ValueError(
                "The following indices had items that did not have the "
                f"{embedding_key}:\n {unqualified_indices}"
            )

        # We can also do this operation in the first map that creates texts, but that might make additional operations
        # in here a lot more annoying. It's an optimization that shouldn't happen right now.
        list(map(lambda item: item.pop(embedding_key), text_embedding_items))

        return self.embed_and_join_metadata_by_columns(
            texts=texts, metadatas=text_embedding_items, model=model
        )

    def embed_items(
        self,
        text_embedding_items: List[Dict],
        model: EmbeddingModel = EmbeddingModel.MINILM,
    ) -> Dict[str, List[Dict]]:
        """Takes items with text and metadata, and embeds the text using a model in starpoint. Metadata is joined with
        the results for ergonomics.

        Args:
            text_embedding_items: List of dict where the text and metadata are paired together
            model: An enum choice from EmbeddingModel.

        Returns:
            dict: Result with list of texts, metadata, and embeddings.

        Raises:
            requests.exceptions.SSLError: Failure likely due to network issues.
        """

        request_data = dict(items=text_embedding_items, model=model.value)
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
