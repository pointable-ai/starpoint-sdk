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
READER_URL = "https://reader.starpoint.ai"

# Endpoints
INFER_SCHEMA_PATH = "/api/v1/infer_schema"
QUERY_PATH = "/api/v1/query"


# Error and warning messages
SSL_ERROR_MSG = "Request failed due to SSLError. Error is likely due to invalid API key. Please check if your API is correct and still valid."


class Reader(object):
    """Client for the Reader endpoints. If you do not need to separate reading or
    writing for, consider using the [`Client` object](#client-objects).
    """

    def __init__(self, api_key: UUID, host: Optional[str] = None):
        if host is None:
            host = READER_URL

        self.host = _validate_host(host)
        self.api_key = api_key

    def query(
        self,
        sql: Optional[str] = None,
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
        query_embedding: Optional[List[float]] = None,
        params: Optional[List[Any]] = None,
        text_search_query: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Queries a collection. This could be by sql or query embeddings.

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
            text_search_query=text_search_query,
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
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Infers the schema of a particular collection.
        Gives the results back by column name and the inferred type for that column.

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
