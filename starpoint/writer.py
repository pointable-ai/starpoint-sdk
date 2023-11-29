import logging
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
    """Client for the Writer endpoints. If you do not need to separate reading or
    writing for, consider using the [`Client` object](#client-objects)."""

    def __init__(self, api_key: UUID, host: Optional[str] = None):
        if host is None:
            host = WRITER_URL

        self.host = _validate_host(host)
        self.api_key = api_key

    def delete(
        self,
        documents: List[str],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Remove documents in an existing collection.

        Args:
            documents: The documents to remove from the collection.
            collection_id: The collection's id to remove the documents from.
                This or the `collection_name` needs to be provided.
            collection_name: The collection's name to remove the documents from.
                This or the `collection_id` needs to be provided.

        Returns:
            dict: delete response json

        Raises:
            ValueError: If neither collection id and collection name are provided.
            ValueError: If both collection id and collection name are provided.
        """
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
        """Insert documents into an existing collection.

        Args:
            documents: The documents to insert into the collection.
            collection_id: The collection's id to insert the documents to.
                This or the `collection_name` needs to be provided.
            collection_name: The collection's name to insert the documents to.
                This or the `collection_id` needs to be provided.

        Returns:
            dict: insert response json

        Raises:
            ValueError: If neither collection id and collection name are provided.
            ValueError: If both collection id and collection name are provided.
            requests.exceptions.SSLError: Failure likely due to network issues.
        """

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
        embeddings: List[Dict[str, List[float] | int]],
        document_metadatas: List[Dict[Any, Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Insert documents into an existing collection by embedding and document metadata arrays.
        The arrays are zipped together and inserted as a document in the order of the two arrays.

        Args:
            embeddings: A list of embeddings.
                Order of the embeddings should match the document_metadatas.
            document_metadatas: A list of metadata to be associated with embeddings.
                Order of these metadatas should match the embeddings.
            collection_id: The collection's id to insert the documents to.
                This or the `collection_name` needs to be provided.
            collection_name: The collection's name to insert the documents to.
                This or the `collection_id` needs to be provided.

        Returns:
            dict: insert response json

        Raises:
            ValueError: If neither collection id and collection name are provided.
            ValueError: If both collection id and collection name are provided.
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        if len(embeddings) != len(document_metadatas):
            LOGGER.warning(EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING)

        documents = [
            {
                "embeddings": embedding,
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
        """Update documents in an existing collection.

        Args:
            documents: The documents to update in the collection.
            collection_id: The collection's id where the documents will be updated.
                This or the `collection_name` needs to be provided.
            collection_name: The collection's name where the documents will be updated.
                This or the `collection_id` needs to be provided.

        Returns:
            dict: update response json

        Raises:
            ValueError: If neither collection id and collection name are provided.
            ValueError: If both collection id and collection name are provided.
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
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

    def column_update(
        self,
        ids: List[str],
        embeddings: List[Dict[str, List[float] | int]],
        document_metadatas: List[Dict[Any, Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Updates documents for an existing collection by embedding and document metadata arrays.
        The arrays are zipped together and updates the document in the order of the two arrays.

        Args:
            embeddings: A list of embeddings.
                Order of the embeddings should match the document_metadatas.
            document_metadatas: A list of metadata to be associated with embeddings.
                Order of these metadatas should match the embeddings.
            collection_id: The collection's id where the documents will be updated.
                This or the `collection_name` needs to be provided.
            collection_name: The collection's name where the documents will be updated.
                This or the `collection_id` needs to be provided.

        Returns:
            dict: update response json

        Raises:
            ValueError: If neither collection id and collection name are provided.
            ValueError: If both collection id and collection name are provided.
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        if len(embeddings) != len(document_metadatas) or len(embeddings) != len(ids):
            LOGGER.warning(EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING)

        documents = [
            {
                "id": id,
                "embeddings": embedding,
                "metadata": document_metadata,
            }
            for embedding, document_metadata, id in zip(
                embeddings, document_metadatas, ids
            )
        ]

        return self.update(
            documents=documents,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def create_collection(
        self, collection_name: str, dimensionality: int
    ) -> Dict[Any, Any]:
        """Creates a collection by name and dimensionality. Dimensionality
        should be greater than 0.

        Args:
            collection_name: The name of the collection that will be created.
            dimensionality: The number of dimensions the collection will have.
                Must be an int larger than 0.

        Returns:
            dict: create collections response json

        Raises:
            ValueError: If dimensionality is 0 or less.
            requests.exceptions.SSLError: Failure likely due to network issues.
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
        """Deletes a collection.

        Args:
            collection_id: The id of the collection that will be deleted.

        Returns:
            dict: deleted collection response json

        Raises:
            requests.exceptions.SSLError: Failure likely due to network issues.
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
