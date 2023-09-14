from typing import List
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

import pytest
from _pytest.monkeypatch import MonkeyPatch
from requests.exceptions import SSLError

from starpoint import embedding


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

    actual_json = mock_embedding_client.embed(["asdf"], embedding.EmbeddingModel.MINILM)

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
        mock_embedding_client.embed(["asdf"], embedding.EmbeddingModel.MINILM)

    logger_mock.error.assert_called_once_with(embedding.SSL_ERROR_MSG)


@patch("starpoint.embedding.EmbeddingClient.embed_items")
@patch("starpoint.embedding.requests")
def test_embedding_embed(
    requests_mock: MagicMock,
    embed_items_mock: MagicMock,
    mock_embedding_client: embedding.EmbeddingClient,
):
    input_text = "asdf"
    input_model = embedding.EmbeddingModel.MINILM
    expected_item = [{"text": input_text, "metadata": None}]

    actual_json = mock_embedding_client.embed([input_text], input_model)

    embed_items_mock.assert_called_once_with(
        text_embedding_items=expected_item, model=input_model
    )


@patch("starpoint.embedding.EmbeddingClient.embed_items")
@patch("starpoint.embedding.requests")
def test_embedding_embed_and_join_metadata_by_columns(
    requests_mock: MagicMock,
    embed_items_mock: MagicMock,
    mock_embedding_client: embedding.EmbeddingClient,
):
    input_text = "asdf"
    input_metadata = {"label": "asdf"}
    input_model = embedding.EmbeddingModel.MINILM
    expected_item = [{"text": input_text, "metadata": input_metadata}]

    actual_json = mock_embedding_client.embed_and_join_metadata_by_columns(
        [input_text], [input_metadata], input_model
    )

    embed_items_mock.assert_called_once_with(
        text_embedding_items=expected_item, model=input_model
    )


@patch("starpoint.embedding.EmbeddingClient.embed_items")
@patch("starpoint.embedding.requests")
def test_embedding_embed_and_join_metadata_by_columns_non_list_texts(
    requests_mock: MagicMock,
    embed_items_mock: MagicMock,
    mock_embedding_client: embedding.EmbeddingClient,
):
    input_metadata = {"label": "asdf"}
    input_model = embedding.EmbeddingModel.MINILM

    with pytest.raises(ValueError):
        mock_embedding_client.embed_and_join_metadata_by_columns(
            "not_list_texts", [input_metadata], input_model
        )


@patch("starpoint.embedding.EmbeddingClient.embed_items")
@patch("starpoint.embedding.requests")
def test_embedding_embed_and_join_metadata_by_columns_non_list_metadatas(
    requests_mock: MagicMock,
    embed_items_mock: MagicMock,
    mock_embedding_client: embedding.EmbeddingClient,
):
    input_text = "asdf"
    input_model = embedding.EmbeddingModel.MINILM

    with pytest.raises(ValueError):
        mock_embedding_client.embed_and_join_metadata_by_columns(
            [input_text], {"label": "not_list_metadatas"}, input_model
        )


@pytest.mark.parametrize(
    "input_text,input_metadata",
    [
        [
            ["embed_text1", "embed_text2"],
            [{"label": "label1"}],
        ],
        [
            ["embed_text1"],
            [{"label": "label1"}, {"label": "label2"}],
        ],
    ],
)
@patch("starpoint.embedding.EmbeddingClient.embed_items")
@patch("starpoint.embedding.requests")
def test_embedding_embed_and_join_metadata_by_columns_mismatch_list(
    requests_mock: MagicMock,
    embed_items_mock: MagicMock,
    mock_embedding_client: embedding.EmbeddingClient,
    input_text: List,
    input_metadata: List,
    monkeypatch: MonkeyPatch,
):
    input_model = embedding.EmbeddingModel.MINILM

    logger_mock = MagicMock()
    monkeypatch.setattr(embedding, "LOGGER", logger_mock)

    actual_json = mock_embedding_client.embed_and_join_metadata_by_columns(
        input_text, input_metadata, input_model
    )

    logger_mock.warning.assert_called_once_with(
        embedding.TEXT_METADATA_LENGTH_MISMATCH_WARNING
    )


@patch("starpoint.embedding.requests")
def test_embedding_embed_items(
    requests_mock: MagicMock,
    mock_embedding_client: embedding.EmbeddingClient,
):
    requests_mock.post().ok = True
    test_value = {"mock_return": "value"}
    requests_mock.post().json.return_value = test_value

    expected_json = {}

    actual_json = mock_embedding_client.embed_items(
        [{"text": "asdf", "metadata": {"label": "asdf"}}],
        embedding.EmbeddingModel.MINILM,
    )

    requests_mock.post.assert_called()
    requests_mock.post().json.assert_called()
    assert actual_json == test_value
