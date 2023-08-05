from tempfile import NamedTemporaryFile
from uuid import uuid4
from unittest.mock import MagicMock, patch

import pytest
from _pytest.monkeypatch import MonkeyPatch

from starpoint import openai


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_init_openai_no_api_value(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    with pytest.raises(ValueError, match=openai.NO_API_KEY_VALUE_ERROR):
        openai.OpenAIClient(MagicMock())


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_init_openai_both_api_value(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    with pytest.raises(ValueError, match=openai.MULTI_API_KEY_VALUE_ERROR):
        openai.OpenAIClient(MagicMock(), "mock_key", "mock_path")


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_init_openai_with_api_key(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    mock_api_key = "mock_key"

    client = openai.OpenAIClient(MagicMock(), openai_key=mock_api_key)

    assert client.openai.api_key == mock_api_key


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_init_openai_with_api_path(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    temp_file = NamedTemporaryFile()

    client = openai.OpenAIClient(MagicMock(), openai_key_filepath=temp_file.name)

    assert client.openai.api_key_path == temp_file.name


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_init_openai_with_bad_api_path(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    mock_api_key_path = "1234~/path"

    with pytest.raises(ValueError, match=openai.NO_API_KEY_FILE_ERROR):
        openai.OpenAIClient(MagicMock(), openai_key_filepath=mock_api_key_path)


@patch("starpoint.openai._utils._check_collection_identifier_collision")
@patch("starpoint.openai.OpenAIClient._init_openai")
@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_build_and_insert_embeddings_input_string_success(
    mock_writer: MagicMock,
    mock_reader: MagicMock,
    mock_init_openai: MagicMock,
    collision_mock: MagicMock,
):
    starpoint_mock = MagicMock()
    client = openai.OpenAIClient(starpoint_mock)
    openai_mock = MagicMock()
    client.openai = openai_mock

    mock_embedding = 0.77
    expected_embedding_response = {
        "data": [
            {
                "embedding": mock_embedding,
                "index": 0,
            }
        ]
    }
    openai_mock.Embedding.create.return_value = expected_embedding_response

    mock_input = "mock_input"
    mock_model = "mock-model"

    expected_build_and_insert_response = {
        "openai_response": expected_embedding_response,
        "starpoint_response": starpoint_mock.column_insert(),
    }

    actual_build_and_insert_response = client.build_and_insert_embeddings(
        model=mock_model, input_data=mock_input
    )

    assert actual_build_and_insert_response == expected_build_and_insert_response
    collision_mock.assert_called_once()

    # independently check args since embeddings is a map() generator and cannot be checked against simple equality
    insert_call_kwargs = starpoint_mock.column_insert.call_args.kwargs
    assert [mock_embedding] == list(insert_call_kwargs.get("embeddings"))
    assert [{"input": mock_input}] == insert_call_kwargs.get("document_metadatas")
    assert insert_call_kwargs.get("collection_id") is None  # default value
    assert insert_call_kwargs.get("collection_name") is None  # default value


@patch("starpoint.openai._utils._check_collection_identifier_collision")
@patch("starpoint.openai.OpenAIClient._init_openai")
@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_build_and_insert_embeddings_input_list_success(
    mock_writer: MagicMock,
    mock_reader: MagicMock,
    mock_init_openai: MagicMock,
    collision_mock: MagicMock,
):
    starpoint_mock = MagicMock()
    client = openai.OpenAIClient(starpoint_mock)
    openai_mock = MagicMock()
    client.openai = openai_mock

    expected_embedding_response = {
        "data": [
            {
                "embedding": 0.77,
                "index": 0,
            },
            {
                "embedding": 0.88,
                "index": 1,
            },
        ]
    }
    openai_mock.Embedding.create.return_value = expected_embedding_response

    mock_input = ["mock_input1", "mock_input2"]
    mock_model = "mock-model"

    expected_build_and_insert_response = {
        "openai_response": expected_embedding_response,
        "starpoint_response": starpoint_mock.column_insert(),
    }

    actual_build_and_insert_response = client.build_and_insert_embeddings(
        model=mock_model, input_data=mock_input
    )

    assert actual_build_and_insert_response == expected_build_and_insert_response
    collision_mock.assert_called_once()

    # independently check args since embeddings is a map() generator and cannot be checked against simple equality
    insert_call_kwargs = starpoint_mock.column_insert.call_args.kwargs
    assert [0.77, 0.88] == list(insert_call_kwargs.get("embeddings"))
    assert [
        {"input": "mock_input1"},
        {"input": "mock_input2"},
    ] == insert_call_kwargs.get("document_metadatas")
    assert insert_call_kwargs.get("collection_id") is None  # default value
    assert insert_call_kwargs.get("collection_name") is None  # default value


@patch("starpoint.openai._utils._check_collection_identifier_collision")
@patch("starpoint.openai.OpenAIClient._init_openai")
@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_build_and_insert_embeddings_no_data_in_response(
    mock_writer: MagicMock,
    mock_reader: MagicMock,
    mock_init_openai: MagicMock,
    collision_mock: MagicMock,
    monkeypatch: MonkeyPatch,
):
    starpoint_mock = MagicMock()
    client = openai.OpenAIClient(starpoint_mock)
    openai_mock = MagicMock()
    client.openai = openai_mock

    expected_embedding_response = {"mock": "return"}
    openai_mock.Embedding.create.return_value = expected_embedding_response

    logger_mock = MagicMock()
    monkeypatch.setattr(openai, "LOGGER", logger_mock)

    mock_input = "mock_input"
    mock_model = "mock-model"

    expected_build_and_insert_response = {
        "openai_response": expected_embedding_response,
        "starpoint_response": None,
    }

    actual_build_and_insert_response = client.build_and_insert_embeddings(
        model=mock_model, input_data=mock_input
    )

    assert actual_build_and_insert_response == expected_build_and_insert_response
    collision_mock.assert_called_once()
    starpoint_mock.column_insert.assert_not_called()
    logger_mock.warning.assert_called_once_with(openai.NO_EMBEDDING_DATA_FOUND)


@patch("starpoint.openai._utils._check_collection_identifier_collision")
@patch("starpoint.openai.OpenAIClient._init_openai")
@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_build_and_insert_embeddings_exception_during_write(
    mock_writer: MagicMock,
    mock_reader: MagicMock,
    mock_init_openai: MagicMock,
    collision_mock: MagicMock,
    monkeypatch: MonkeyPatch,
):
    starpoint_mock = MagicMock()
    client = openai.OpenAIClient(starpoint_mock)
    openai_mock = MagicMock()
    client.openai = openai_mock

    expected_embedding_response = {
        "data": [
            {
                "embedding": 0.77,
                "index": 0,
            }
        ]
    }
    openai_mock.Embedding.create.return_value = expected_embedding_response

    column_insert_error_message = "Test Exception"
    starpoint_mock.column_insert.side_effect = RuntimeError(column_insert_error_message)

    logger_mock = MagicMock()
    monkeypatch.setattr(openai, "LOGGER", logger_mock)

    mock_input = "mock_input"
    mock_model = "mock-model"

    expected_build_and_insert_response = {
        "openai_response": expected_embedding_response,
        "starpoint_response": {"error": column_insert_error_message},
    }

    build_and_insert_response = client.build_and_insert_embeddings(
        model=mock_model, input_data=mock_input
    )

    assert build_and_insert_response == expected_build_and_insert_response
    collision_mock.assert_called_once()
    logger_mock.error.assert_called_once()


@patch("starpoint.openai.OpenAIClient.build_and_insert_embeddings")
@patch("starpoint.openai._utils._check_collection_identifier_collision")
@patch("starpoint.openai.OpenAIClient._init_openai")
@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_default_build_and_insert_embeddings(
    mock_writer: MagicMock,
    mock_reader: MagicMock,
    mock_init_openai: MagicMock,
    collision_mock: MagicMock,
    build_and_insert_embeddings_mock: MagicMock,
):
    client = openai.OpenAIClient(MagicMock())
    mock_input = "mock_input"

    client.default_build_and_insert_embeddings(input_data=mock_input)

    build_and_insert_embeddings_mock.assert_called_once_with(
        model=openai.DEFAULT_OPENAI_MODEL,
        input_data=mock_input,
        collection_id=None,
        collection_name=None,
    )
