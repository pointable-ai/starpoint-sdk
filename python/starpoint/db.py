import logging
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Union
from uuid import UUID

import openai
import requests
import validators

from starpoint import reader, writer, _utils

LOGGER = logging.getLogger(__name__)


class Client(object):
    """Client that combines Reader and Writer. It is recommended that one use this client rather than
    Reader and Writer independently."""

    def __init__(
        self,
        api_key: UUID,
        reader_host: Optional[str] = None,
        writer_host: Optional[str] = None,
    ):
        self.writer = writer.Writer(api_key=api_key, host=writer_host)
        self.reader = reader.Reader(api_key=api_key, host=reader_host)

        # Consider a wrapper around openai once this class gets bloated
        self.openai = None

    def delete(
        self,
        documents: List[str],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Remove documents in an existing collection. `delete()` method from [`Writer`](#writer-objects).

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
        return self.writer.delete(
            documents=documents,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def insert(
        self,
        documents: List[Dict[Any, Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Insert documents into an existing collection. `insert()` method from [`Writer`](#writer-objects).

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
        return self.writer.insert(
            documents=documents,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def column_insert(
        self,
        embeddings: List[float],
        document_metadatas: List[Dict[Any, Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Insert documents into an existing collection by embedding and document metadata arrays.
        The arrays are zipped together and inserted as a document in the order of the two arrays.
        `column_insert()` method from [`Writer`](#writer-objects).

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
        return self.writer.column_insert(
            embeddings=embeddings,
            document_metadatas=document_metadatas,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def query(
        self,
        sql: Optional[str] = None,
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
        query_embedding: Optional[List[float]] = None,
        params: Optional[List[Any]] = None,
    ) -> Dict[Any, Any]:
        """Queries a collection. This could be by sql or query embeddings.
        `query()` method from [`Reader`](#reader-objects).

        Args:
            sql: Raw SQL to run against the collection.
            collection_id: The collection's id where the query will happen.
                This or the `collection_name` needs to be provided.
            collection_name: The collection's name where the query will happen.
                This or the `collection_id` needs to be provided.
            query_embedding: An embedding to query against the collection using similarity search.
            params: values for parameterized sql

        Returns:
            dict: query response json

        Raises:
            ValueError: If neither collection id and collection name are provided.
            ValueError: If both collection id and collection name are provided.
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        return self.reader.query(
            sql=sql,
            collection_id=collection_id,
            collection_name=collection_name,
            query_embedding=query_embedding,
            params=params,
        )

    def infer_schema(
        self,
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Infers the schema of a particular collection.
        Gives the results back by column name and the inferred type for that column.
        `infer_schema()` method from [`Reader`](#reader-objects).

        Args:
            collection_id: The collection's id where the query will happen.
                This or the `collection_name` needs to be provided.
            collection_name: The collection's name where the query will happen.
                This or the `collection_id` needs to be provided.

        Returns:
            dict: infer schema response json

        Raises:
            ValueError: If neither collection id and collection name are provided.
            ValueError: If both collection id and collection name are provided.
            requests.exceptions.SSLError: Failure likely due to network issues.
        """
        return self.reader.infer_schema(
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def update(
        self,
        documents: List[Dict[Any, Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Update documents in an existing collection. `update()` method in
        [`Writer`](#writer-objects).

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
        return self.writer.update(
            documents=documents,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def create_collection(
        self, collection_name: str, dimensionality: int
    ) -> Dict[Any, Any]:
        """Creates a collection by name and dimensionality. Dimensionality
        should be greater than 0. `create_collection()` method from [`Writer`](#writer-objects).

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
        return self.writer.create_collection(
            collection_name=collection_name,
            dimensionality=dimensionality,
        )

    def delete_collection(self, collection_id: str) -> Dict[Any, Any]:
        """Deletes a collection. `delete_collection()` method from [`Writer`](#writer-objects)."""
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
        input_data: Union[str, Iterable[Any]],
        document_metadatas: Optional[List[Dict[Any, Any]]] = None,
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
        openai_user: Optional[str] = None,
    ) -> Dict[Any, Any]:
        if self.openai is None:
            raise RuntimeError(
                "OpenAI instance has not been initialized. Please initialize it using "
                "Client.init_openai()"
            )

        _utils._check_collection_identifier_collision(collection_id, collection_name)

        embedding_response = self.openai.Embedding.create(
            model=model, input=input_data, user=openai_user
        )

        embedding_data = embedding_response.get("data")
        if embedding_data is None:
            LOGGER.warning(NO_EMBEDDING_DATA_FOUND)
            return {
                "openai_response": embedding_response,
                "starpoint_response": None,
            }

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
            starpoint_response = self.column_insert(
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
            starpoint_response = {"error": str(e)}

        return {
            "openai_response": embedding_response,
            "starpoint_response": starpoint_response,
        }

    def build_and_insert_embeddings(
        self,
        input_data: Union[str, Iterable[Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        return self.build_and_insert_embeddings_from_openai(
            model="text-embedding-ada-002",
            input_data=input_data,
            collection_id=collection_id,
            collection_name=collection_name,
        )
