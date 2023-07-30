import logging
from typing import Dict, Optional
from uuid import UUID

import requests
import validators

LOGGER = logging.getLogger(__name__)

# Key in the header value
API_HEADER_KEY = "x-starpoint-key"

# Health check for the hosts
HEALTH_CHECK_MESSAGE = "hello."

# Error messages for collections
NO_COLLECTION_VALUE_ERROR = (
    "Please provide at least one value for either collection_id or collection_name."
)
MULTI_COLLECTION_VALUE_ERROR = (
    "Please only provide either collection_id or collection_name in your request."
)
NO_HOST_ERROR = "No host value provided. A host must be provided."


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
        raise ValueError(NO_HOST_ERROR)
    elif validators.url(host) is not True:  # type: ignore
        raise ValueError(f"Provided host {host} is not a valid url format.")

    # Make sure we don't have dangling backslashes in the url during url composition later
    trimmed_hostname = host.rstrip("/")

    _check_host_health(trimmed_hostname)

    return trimmed_hostname


def _check_collection_identifier_collision(
    collection_id: Optional[str] = None, collection_name: Optional[str] = None
):
    if collection_id is None and collection_name is None:
        raise ValueError(NO_COLLECTION_VALUE_ERROR)
    elif collection_id and collection_name:
        raise ValueError(MULTI_COLLECTION_VALUE_ERROR)
