import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

import requests

from starpoint._utils import (
    _build_header,
    _check_collection_identifier_collision,
    _set_and_validate_host,
)

LOGGER = logging.getLogger(__name__)

# Host
WRITER_URL = "https://writer.starpoint.ai"

# Endpoints
COLLECTIONS_PATH = "/api/v1/collections"
DOCUMENTS_PATH = "/api/v1/documents"

# Error and warning messages
DIMENSIONALITY_ERROR = "Dimensionality must be greater than 0."
EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING = (
    "The length of the embeddings and document_metadata provided are different. There may be a mismatch "
    "between embeddings and the expected document metadata length; this may cause undesired collection insert or update."
)
SSL_ERROR_MSG = "Request failed due to SSLError. Error is likely due to invalid API key. Please check if your API is correct and still valid."


class Writer(object):
    """docstring for Writer"""

    def __init__(self, api_key: UUID, host: Optional[str] = None):
        if host is None:
            host = WRITER_URL

        self.host = _set_and_validate_host(host)
        self.api_key = api_key

    def delete(
        self,
        documents: List[str],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        _check_collection_identifier_collision(collection_id, collection_name)
        # TODO: Be safe and make sure the item passed through that doesn't hold a value is a None

        # TODO: filter through documents to make sure values are what we expect them to be
        """
        dict(
            collection_id="collection_id_example",
            collection_name="collection_name_example",
            documents=["uuid-uuid-uuid"]
            ],
        )
        """

        request_data = dict(
            collection_id=collection_id,
            collection_name=collection_name,
            documents=[str(document) for document in documents],
        )
        try:
            response = requests.delete(
                url=f"{self.host}{DOCUMENTS_PATH}",
                json=request_data,
                headers=_build_header(
                    api_key=self.api_key,
                    additional_headers={"Content-Type": "application/json"},
                ),
            )
        except requests.exceptions.SSLError as e:
            LOGGER.error(SSL_ERROR_MSG)
            raise e

        if not response.ok:
            LOGGER.error(
                f"Request failed with status code {response.status_code} "
                f"and the following message:\n{response.text}"
            )
            return {}
        return response.json()

    def insert(
        self,
        documents: List[Dict[Any, Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        _check_collection_identifier_collision(collection_id, collection_name)
        # TODO: Be safe and make sure the item passed through that doesn't hold a value is a None

        # TODO: filter through documents to make sure values are what we expect them to be
        """
        dict(
            collection_id="collection_id_example",
            collection_name="collection_name_example",
            documents=[
                dict(
                    embedding=[3.14],
                    metadata=dict(),
                )
            ],
        )
        """

        request_data = dict(
            collection_id=collection_id,
            collection_name=collection_name,
            documents=documents,
        )
        try:
            response = requests.post(
                url=f"{self.host}{DOCUMENTS_PATH}",
                json=request_data,
                headers=_build_header(
                    api_key=self.api_key,
                    additional_headers={"Content-Type": "application/json"},
                ),
            )
        except requests.exceptions.SSLError as e:
            LOGGER.error(SSL_ERROR_MSG)
            raise e

        if not response.ok:
            LOGGER.error(
                f"Request failed with status code {response.status_code} "
                f"and the following message:\n{response.text}"
            )
            return {}
        return response.json()

    def column_insert(
        self,
        embeddings: List[float],
        document_metadatas: List[Dict[Any, Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        if len(embeddings) != len(document_metadatas):
            LOGGER.warning(EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING)

        documents = [
            {
                "embedding": embedding,
                "metadata": document_metadata,
            }
            for embedding, document_metadata in zip(embeddings, document_metadatas)
        ]

        return self.insert(
            documents=documents,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def update(
        self,
        documents: List[Dict[Any, Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        _check_collection_identifier_collision(collection_id, collection_name)
        # TODO: Be safe and make sure the item passed through that doesn't hold a value is a None

        # TODO: filter through documents to make sure values are what we expect them to be
        """
        dict(
            collection_id="collection_id_example",
            collection_name="collection_name_example",
            documents=[
                dict(
                    id:"UUID-UUID-UUID",
                    metadata={},
                )
            ],
        )
        """

        request_data = dict(
            collection_id=collection_id,
            collection_name=collection_name,
            documents=documents,
        )
        try:
            response = requests.patch(
                url=f"{self.host}{DOCUMENTS_PATH}",
                json=request_data,
                headers=_build_header(
                    api_key=self.api_key,
                    additional_headers={"Content-Type": "application/json"},
                ),
            )
        except requests.exceptions.SSLError as e:
            LOGGER.error(SSL_ERROR_MSG)
            raise e

        if not response.ok:
            LOGGER.error(
                f"Request failed with status code {response.status_code} "
                f"and the following message:\n{response.text}"
            )
            return {}
        return response.json()

    def create_collection(
        self, collection_name: str, dimensionality: int
    ) -> Dict[Any, Any]:
        """
        dict(
            name="collection_name_example",
            dimensionality=1024,
        )
        """

        if dimensionality <= 0:
            raise ValueError(DIMENSIONALITY_ERROR)

        request_data = dict(
            name=collection_name,
            dimensionality=dimensionality,
        )
        try:
            response = requests.post(
                url=f"{self.host}{COLLECTIONS_PATH}",
                json=request_data,
                headers=_build_header(
                    api_key=self.api_key,
                    additional_headers={"Content-Type": "application/json"},
                ),
            )
        except requests.exceptions.SSLError as e:
            LOGGER.error(SSL_ERROR_MSG)
            raise e

        if not response.ok:
            LOGGER.error(
                f"Request failed with status code {response.status_code} "
                f"and the following message:\n{response.text}"
            )
            return {}
        return response.json()

    def delete_collection(self, collection_id: str) -> Dict[Any, Any]:
        """
        dict(
            collection_id="collection_id_example",
        )
        """

        request_data = dict(
            collection_id=collection_id,
        )
        try:
            response = requests.delete(
                url=f"{self.host}{COLLECTIONS_PATH}",
                json=request_data,
                headers=_build_header(
                    api_key=self.api_key,
                    additional_headers={"Content-Type": "application/json"},
                ),
            )
        except requests.exceptions.SSLError as e:
            LOGGER.error(SSL_ERROR_MSG)
            raise e

        if not response.ok:
            LOGGER.error(
                f"Request failed with status code {response.status_code} "
                f"and the following message:\n{response.text}"
            )
            return {}
        return response.json()