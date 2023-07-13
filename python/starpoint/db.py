import logging
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Union
from uuid import UUID

import openai
import requests
import validators

LOGGER = logging.getLogger(__name__)

COLLECTIONS_PATH = "/api/v1/collections"
DOCUMENTS_PATH = "/api/v1/documents"
QUERY_PATH = "/api/v1/query"
INFER_SCHEMA_PATH = "/api/v1/infer_schema"
API_HEADER_KEY = "x-starpoint-key"

READER_URL = "https://reader.starpoint.ai"
WRITER_URL = "https://writer.starpoint.ai"

HEALTH_CHECK_MESSAGE = "hello."

NO_HOST_ERROR = "No host value provided. A host must be provided."
NO_COLLECTION_VALUE_ERROR = (
    "Please provide at least one value for either collection_id or collection_name."
)
MULTI_COLLECTION_VALUE_ERROR = (
    "Please only provide either collection_id or collection_name in your request."
)
NO_API_KEY_VALUE_ERROR = "Please provide at least one value for either api_key or filepath where the api key lives."
MULTI_API_KEY_VALUE_ERROR = "Please only provide either api_key or filepath with the api_key in your initialization."
NO_API_KEY_FILE_ERROR = "The provided filepath for the API key is not a valid file."
SSL_ERROR_MSG = "Request failed due to SSLError. Error is likely due to invalid API key. Please check if your API is correct and still valid."
EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING = (
    "The length of the embeddings and document_metadata provided are different. There may be a mismatch "
    "between embeddings and the expected document metadata length; this may cause undesired collection insert or update."
)
NO_EMBEDDING_DATA_FOUND = (
    "No embedding data found in the embedding response from OpenAI."
)
DIMENSIONALITY_ERROR = "Dimensionality must be greater than 0."


def _build_header(api_key: UUID, additional_headers: Optional[Dict[str, str]] = None):
    header = {API_HEADER_KEY: str(api_key)}
    if additional_headers is not None:
        header.update(additional_headers)
    return header


def _check_host_health(hostname: str):
    resp = requests.get(hostname)
    assert (
        resp.ok
    ), f"Host cannot be validated, response from host {hostname}: {resp.text}"
    if resp.text != HEALTH_CHECK_MESSAGE:
        LOGGER.warning(
            f"{hostname} returned {resp.text} instead of {HEALTH_CHECK_MESSAGE}; host may be unhealthy and "
            "may be unable to serve requests."
        )


def _set_and_validate_host(host: str):
    if not host:
        raise ValueError("No host value provided. A host must be provided.")
    elif validators.url(host) is not True:  # type: ignore
        raise ValueError(f"Provided host {host} is not a valid url format.")

    # Make sure we don't have dangling backslashes in the url during url composition later
    trimmed_hostname = host.rstrip("/")

    _check_host_health(trimmed_hostname)

    return trimmed_hostname


def _check_collection_identifier_collision(
    collection_id: Optional[UUID] = None, collection_name: Optional[str] = None
):
    if collection_id is None and collection_name is None:
        raise ValueError(NO_COLLECTION_VALUE_ERROR)
    elif collection_id and collection_name:
        raise ValueError(MULTI_COLLECTION_VALUE_ERROR)


class Writer(object):
    """docstring for Writer"""

    def __init__(self, api_key: UUID, host: Optional[str] = None):
        if host is None:
            host = WRITER_URL

        self.host = _set_and_validate_host(host)
        self.api_key = api_key

    def delete(
        self,
        documents: List[UUID],
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
            collection_id=str(collection_id),
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
        collection_id: Optional[UUID] = None,
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

    def transpose_and_insert(
        self,
        embeddings: List[float],
        document_metadatas: List[Dict[Any, Any]],
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        if len(embeddings) != len(document_metadatas):
            LOGGER.warning(EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING)

        document = [
            {
                "embedding": embedding,
                "metadata": document_metadata,
            }
            for embedding, document_metadata in zip(embeddings, document_metadatas)
        ]

        self.insert(
            document=document,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def update(
        self,
        documents: List[Dict[Any, Any]],
        collection_id: Optional[UUID] = None,
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

    def delete_collection(self, collection_id: UUID) -> Dict[Any, Any]:
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


class Reader(object):
    """docstring for Reader"""

    def __init__(self, api_key: UUID, host: Optional[str] = None):
        if host is None:
            host = READER_URL

        self.host = _set_and_validate_host(host)
        self.api_key = api_key

    def query(
        self,
        sql: Optional[str] = None,
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
        query_embedding: Optional[List[float]] = None,
        params: Optional[List[Any]] = None,
    ) -> Dict[Any, Any]:
        _check_collection_identifier_collision(collection_id, collection_name)
        # TODO: Be safe and make sure the item passed through that doesn't hold a value is a None

        # TODO: filter through query_embedding to make sure values are what we expect
        """
        dict(
            collection_id="collection_id_example",
            collection_name="collection_name_example",
            query_embedding=None,
            sql="sql_example",
        )
        """

        request_data = dict(
            collection_id=collection_id,
            collection_name=collection_name,
            query_embedding=query_embedding,
            sql=sql,
            params=params,
        )
        try:
            response = requests.post(
                url=f"{self.host}{QUERY_PATH}",
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

    def infer_schema(
        self,
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[any, any]:
        _check_collection_identifier_collision(collection_id, collection_name)
        # TODO: Be safe and make sure the item passed through that doesn't hold a value is a None

        """
        dict(
            collection_id="collection_id_example",
            collection_name="collection_name_example",
        )
        """

        request_data = dict(
            collection_id=collection_id,
            collection_name=collection_name,
        )
        response = requests.post(
            url=f"{self.host}{INFER_SCHEMA_PATH}",
            json=request_data,
            headers=_build_header(
                api_key=self.api_key,
                additional_headers={"Content-Type": "application/json"},
            ),
        )

        if not response.ok:
            LOGGER.error(
                f"Request failed with status code {response.status_code} "
                f"and the following message:\n{response.text}"
            )
            return {}
        return response.json()


class Client(object):
    """docstring for Client"""

    def __init__(
        self,
        api_key: UUID,
        reader_host: Optional[str] = None,
        writer_host: Optional[str] = None,
    ):
        self.writer = Writer(api_key=api_key, host=writer_host)
        self.reader = Reader(api_key=api_key, host=reader_host)

        # Consider a wrapper around openai once this class gets bloated
        self.openai = None

    def delete(
        self,
        documents: List[UUID],
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        return self.writer.delete(
            documents=documents,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def insert(
        self,
        documents: List[Dict[Any, Any]],
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        return self.writer.insert(
            documents=documents,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def transpose_and_insert(
        self,
        embeddings: List[float],
        document_metadatas: List[Dict[Any, Any]],
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        return self.writer.transpose_and_insert(
            embeddings=embeddings,
            document_metadatas=document_metadatas,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def query(
        self,
        sql: Optional[str] = None,
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
        query_embedding: Optional[List[float]] = None,
        params: Optional[List[Any]] = None,
    ) -> Dict[Any, Any]:
        return self.reader.query(
            sql=sql,
            collection_id=collection_id,
            collection_name=collection_name,
            query_embedding=query_embedding,
            params=params,
        )

    def infer_schema(
        self,
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        return self.reader.infer_schema(
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def update(
        self,
        documents: List[Dict[Any, Any]],
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        return self.writer.update(
            documents=documents,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def create_collection(
        self, collection_name: str, dimensionality: int
    ) -> Dict[Any, Any]:
        return self.writer.create_collection(
            collection_name=collection_name,
            dimensionality=dimensionality,
        )

    def delete_collection(self, collection_id: UUID) -> Dict[Any, Any]:
        return self.writer.delete_collection(
            collection_id=collection_id,
        )

    """
    OpenAI convenience wrappers
    """

    def init_openai(
        self,
        openai_key: Optional[str] = None,
        openai_key_filepath: Optional[str] = None,
    ):
        """Initializes openai functionality"""
        self.openai = openai
        # TODO: maybe do this for starpoint api_key also

        # If the init is unsuccessful, we deinitialize openai from this object in the except
        try:
            if openai_key and openai_key_filepath:
                raise ValueError(MULTI_API_KEY_VALUE_ERROR)
            elif openai_key is None:
                if openai_key_filepath is None:
                    raise ValueError(NO_API_KEY_VALUE_ERROR)
                if not Path(openai_key_filepath).is_file():
                    raise ValueError(NO_API_KEY_FILE_ERROR)
                self.openai.api_key_path = openai_key_filepath
            else:
                self.openai.api_key = openai_key
        except ValueError as e:
            self.openai = None
            raise e

    def build_and_insert_embeddings_from_openai(
        self,
        model: str,
        input_data: Union[str, Iterable],
        document_metadatas: Optional[List[Dict]] = None,
        collection_id: Optional[UUID] = None,
        collection_name: Optional[str] = None,
        openai_user: Optional[str] = None,
    ) -> Dict:
        if self.openai is None:
            raise RuntimeError(
                "OpenAI instance has not been initialized. Please initialize it using "
                "Client.init_openai()"
            )

        _check_collection_identifier_collision(collection_id, collection_name)

        embedding_response = self.openai.Embedding.create(
            model=model, input=input_data, user=openai_user
        )

        embedding_data = embedding_response.get("data")
        if embedding_data is None:
            LOGGER.warning(NO_EMBEDDING_DATA_FOUND)
            return embedding_response

        if document_metadatas is None:
            LOGGER.info(
                "No custom document_metadatas provided. Using input_data for the document_metadatas"
            )
            if isinstance(input_data, str):
                document_metadatas = [{"input": input_data}]
            else:
                document_metadatas = [{"input": data} for data in input_data]

        # Return the embedding response no matter what issues/bugs we might run into in the sdk
        try:
            sorted_embedding_data = sorted(embedding_data, key=lambda x: x["index"])
            embeddings = map(lambda x: x.get("embedding"), sorted_embedding_data)
            self.transpose_and_insert(
                embeddings=embeddings,
                document_metadatas=document_metadatas,
                collection_id=collection_id,
                collection_name=collection_name,
            )
        except Exception as e:
            LOGGER.error(
                "An exception has occurred while trying to load embeddings into the db. "
                f"This is the error:\n{e}"
            )

        return embedding_response
