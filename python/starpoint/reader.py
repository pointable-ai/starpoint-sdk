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
READER_URL = "https://reader.starpoint.ai"

# Endpoints
INFER_SCHEMA_PATH = "/api/v1/infer_schema"
QUERY_PATH = "/api/v1/query"


# Error and warning messages
SSL_ERROR_MSG = "Request failed due to SSLError. Error is likely due to invalid API key. Please check if your API is correct and still valid."


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
        collection_id: Optional[str] = None,
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
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
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
