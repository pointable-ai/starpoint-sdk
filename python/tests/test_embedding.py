from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

import pytest
from _pytest.monkeypatch import MonkeyPatch
from requests.exceptions import SSLError

from starpoint import embedding
from starpoint.enums import EmbeddingModel


@pytest.fixture(scope="session")
def api_uuid() -> UUID:
    return uuid4()


@pytest.fixture(scope="session")
@patch("starpoint._utils._check_host_health")
def mock_embedding_client(
    host_health_mock: MagicMock, api_uuid: UUID
) -> embedding.EmbeddingClient:
    return embedding.EmbeddingClient(api_uuid)


def test_embedding_default_init(
    mock_embedding_client: embedding.EmbeddingClient, api_uuid: UUID
):
    assert mock_embedding_client.host
    assert mock_embedding_client.host == embedding.EMBEDDING_URL
    assert mock_embedding_client.api_key == api_uuid


@patch("starpoint.embedding._validate_host")
def test_embedding_init_non_default_host(
    mock_host_validator: MagicMock, api_uuid: UUID
):
    test_host = "http://www.example.com"
    test_embedding_client = embedding.EmbeddingClient(api_key=api_uuid, host=test_host)

    mock_host_validator.assert_called_once_with(test_host)
    # This assert needs to be after assert_called_once_with to make sure it doesn't confound the result
    assert test_embedding_client.host == mock_host_validator()
    assert test_embedding_client.api_key == api_uuid


@patch("starpoint.embedding.requests")
def test_embedding_embed_not_200(
    requests_mock: MagicMock,
    mock_embedding_client: embedding.EmbeddingClient,
    monkeypatch: MonkeyPatch,
):
    requests_mock.post().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(embedding, "LOGGER", logger_mock)

    actual_json = mock_embedding_client.embed(["asdf"], EmbeddingModel.MINI6)

    requests_mock.post.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.embedding.requests")
def test_embedding_embed_SSLError(
    requests_mock: MagicMock,
    mock_embedding_client: embedding.EmbeddingClient,
    monkeypatch: MonkeyPatch,
):
    requests_mock.exceptions.SSLError = SSLError
    requests_mock.post.side_effect = SSLError("mock exception")

    logger_mock = MagicMock()
    monkeypatch.setattr(embedding, "LOGGER", logger_mock)

    with pytest.raises(SSLError, match="mock exception"):
        mock_embedding_client.embed(["asdf"], EmbeddingModel.MINI6)

    logger_mock.error.assert_called_once_with(embedding.SSL_ERROR_MSG)
