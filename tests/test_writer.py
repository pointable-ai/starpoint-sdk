from uuid import UUID, uuid4
from unittest.mock import MagicMock, patch

import pytest
from _pytest.monkeypatch import MonkeyPatch
from requests.exceptions import SSLError

from starpoint import writer


@pytest.fixture(scope="session")
def api_uuid() -> UUID:
    return uuid4()


@pytest.fixture(scope="session")
@patch("starpoint._utils._check_host_health")
def mock_writer(host_health_mock: MagicMock, api_uuid: UUID) -> writer.Writer:
    return writer.Writer(api_uuid)


def test_writer_default_init(mock_writer: writer.Writer, api_uuid: UUID):
    assert mock_writer.host
    assert mock_writer.host == writer.WRITER_URL
    assert mock_writer.api_key == api_uuid


def test_writer_init_non_default_host(api_uuid: UUID):
    test_host = "http://www.example.com"
    test_writer = writer.Writer(api_key=api_uuid, host=test_host)

    assert test_writer.host
    assert test_writer.host == test_host
    assert test_writer.api_key == api_uuid


@patch("starpoint.writer._check_collection_identifier_collision")
@patch("starpoint.writer.requests")
def test_writer_delete_by_collection_id(
    requests_mock: MagicMock, collision_mock: MagicMock, mock_writer: writer.Writer
):
    test_uuid = uuid4()

    mock_writer.delete(documents=[uuid4()], collection_id=test_uuid)

    collision_mock.assert_called_once_with(test_uuid, None)
    requests_mock.delete.assert_called_once()


@patch("starpoint.writer._check_collection_identifier_collision")
@patch("starpoint.writer.requests")
def test_writer_delete_by_collection_name(
    requests_mock: MagicMock, collision_mock: MagicMock, mock_writer: writer.Writer
):
    test_collection_name = "mock_collection_name"

    mock_writer.delete(documents=[uuid4()], collection_name=test_collection_name)

    collision_mock.assert_called_once_with(None, test_collection_name)
    requests_mock.delete.assert_called_once()


@patch("starpoint.writer.requests")
def test_writer_delete_not_200(
    requests_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    requests_mock.delete().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    actual_json = mock_writer.delete(
        documents=[uuid4()], collection_name="mock_collection_name"
    )

    requests_mock.delete.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.writer.requests")
def test_writer_delete_SSLError(
    requests_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    requests_mock.exceptions.SSLError = SSLError
    requests_mock.delete.side_effect = SSLError("mock exception")

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    with pytest.raises(SSLError, match="mock exception"):
        mock_writer.delete(documents=[uuid4()], collection_name="mock_collection_name")

    logger_mock.error.assert_called_once_with(writer.SSL_ERROR_MSG)


@patch("starpoint.writer._check_collection_identifier_collision")
@patch("starpoint.writer.requests")
def test_writer_insert_by_collection_id(
    requests_mock: MagicMock, collision_mock: MagicMock, mock_writer: writer.Writer
):
    test_uuid = uuid4()

    mock_writer.insert(documents=[uuid4()], collection_id=test_uuid)

    collision_mock.assert_called_once_with(test_uuid, None)
    requests_mock.post.assert_called_once()


@patch("starpoint.writer._check_collection_identifier_collision")
@patch("starpoint.writer.requests")
def test_writer_insert_by_collection_name(
    requests_mock: MagicMock, collision_mock: MagicMock, mock_writer: writer.Writer
):
    test_collection_name = "mock_collection_name"

    mock_writer.insert(documents=[uuid4()], collection_name=test_collection_name)

    collision_mock.assert_called_once_with(None, test_collection_name)
    requests_mock.post.assert_called_once()


@patch("starpoint.writer.requests")
def test_writer_insert_not_200(
    requests_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    requests_mock.post().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    actual_json = mock_writer.insert(
        documents=[uuid4()], collection_name="mock_collection_name"
    )

    requests_mock.post.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.writer.requests")
def test_writer_insert_SSLError(
    requests_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    requests_mock.exceptions.SSLError = SSLError
    requests_mock.post.side_effect = SSLError("mock exception")

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    with pytest.raises(SSLError, match="mock exception"):
        mock_writer.insert(documents=[uuid4()], collection_name="mock_collection_name")

    logger_mock.error.assert_called_once_with(writer.SSL_ERROR_MSG)


@patch("starpoint.writer.Writer.insert")
def test_writer_column_insert(insert_mock: MagicMock, mock_writer: writer.Writer):
    test_embeddings = [
        {"values": [0.88], "dimensionality": 1},
        {"values": [0.71], "dimensionality": 1},
    ]
    test_document_metadatas = [{"mock": "metadata"}, {"mock2": "metadata2"}]
    expected_insert_document = [
        {
            "embeddings": test_embeddings[0],
            "metadata": test_document_metadatas[0],
        },
        {
            "embeddings": test_embeddings[1],
            "metadata": test_document_metadatas[1],
        },
    ]

    mock_writer.column_insert(
        embeddings=test_embeddings, document_metadatas=test_document_metadatas
    )

    insert_mock.assert_called_once_with(
        documents=expected_insert_document,
        collection_id=None,
        collection_name=None,
    )


@patch("starpoint.writer.Writer.insert")
def test_writer_column_insert_collection_id_collection_name_passed_through(
    insert_mock: MagicMock, mock_writer: writer.Writer
):
    test_embeddings = [
        {"values": [0.88], "dimensionality": 1},
    ]

    test_document_metadatas = [{"mock": "metadata"}]
    expected_insert_document = [
        {
            "embeddings": test_embeddings[0],
            "metadata": test_document_metadatas[0],
        },
    ]
    expected_collection_id = "mock_id"
    expected_collection_name = "mock_name"

    mock_writer.column_insert(
        embeddings=test_embeddings,
        document_metadatas=test_document_metadatas,
        collection_id=expected_collection_id,
        collection_name=expected_collection_name,
    )

    insert_mock.assert_called_once_with(
        documents=expected_insert_document,
        collection_id=expected_collection_id,
        collection_name=expected_collection_name,
    )


@patch("starpoint.writer.Writer.insert")
def test_writer_column_insert_shorter_metadatas_length(
    insert_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    test_embeddings = [
        {"values": [0.88], "dimensionality": 1},
        {"values": [0.71], "dimensionality": 1},
    ]
    test_document_metadatas = [{"mock": "metadata"}]
    expected_insert_document = [
        {
            "embeddings": test_embeddings[0],
            "metadata": test_document_metadatas[0],
        },
    ]

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    mock_writer.column_insert(
        embeddings=test_embeddings, document_metadatas=test_document_metadatas
    )

    logger_mock.warning.assert_called_once_with(
        writer.EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING
    )
    insert_mock.assert_called_once_with(
        documents=expected_insert_document,
        collection_id=None,
        collection_name=None,
    )


@patch("starpoint.writer.Writer.insert")
def test_writer_column_insert_shorter_embeddings_length(
    insert_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    test_embeddings = [
        {"values": [0.88], "dimensionality": 1},
    ]
    test_document_metadatas = [{"mock": "metadata"}, {"mock2": "metadata2"}]
    expected_insert_document = [
        {
            "embeddings": test_embeddings[0],
            "metadata": test_document_metadatas[0],
        },
    ]

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    mock_writer.column_insert(
        embeddings=test_embeddings, document_metadatas=test_document_metadatas
    )

    logger_mock.warning.assert_called_once_with(
        writer.EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING
    )
    insert_mock.assert_called_once_with(
        documents=expected_insert_document,
        collection_id=None,
        collection_name=None,
    )


@patch("starpoint.writer._check_collection_identifier_collision")
@patch("starpoint.writer.requests")
def test_writer_update_by_collection_id(
    requests_mock: MagicMock, collision_mock: MagicMock, mock_writer: writer.Writer
):
    test_uuid = uuid4()

    mock_writer.update(documents=[uuid4()], collection_id=test_uuid)

    collision_mock.assert_called_once_with(test_uuid, None)
    requests_mock.patch.assert_called_once()


@patch("starpoint.writer._check_collection_identifier_collision")
@patch("starpoint.writer.requests")
def test_writer_update_by_collection_name(
    requests_mock: MagicMock, collision_mock: MagicMock, mock_writer: writer.Writer
):
    test_collection_name = "mock_collection_name"

    mock_writer.update(documents=[uuid4()], collection_name=test_collection_name)

    collision_mock.assert_called_once_with(None, test_collection_name)
    requests_mock.patch.assert_called_once()


@patch("starpoint.writer.requests")
def test_writer_update_not_200(
    requests_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    requests_mock.patch().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    actual_json = mock_writer.update(
        documents=[uuid4()], collection_name="mock_collection_name"
    )

    requests_mock.patch.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.writer.requests")
def test_writer_update_SSLError(
    requests_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    requests_mock.exceptions.SSLError = SSLError
    requests_mock.patch.side_effect = SSLError("mock exception")

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    with pytest.raises(SSLError, match="mock exception"):
        mock_writer.update(documents=[uuid4()], collection_name="mock_collection_name")

    logger_mock.error.assert_called_once_with(writer.SSL_ERROR_MSG)


@patch("starpoint.writer.Writer.update")
def test_writer_column_update(update_mock: MagicMock, mock_writer: writer.Writer):
    ids = ["a", "b"]
    test_embeddings = [
        {"values": [0.88], "dimensionality": 1},
        {"values": [0.71], "dimensionality": 1},
    ]
    test_document_metadatas = [{"mock": "metadata"}, {"mock2": "metadata2"}]
    expected_update_document = [
        {
            "id": "a",
            "embeddings": test_embeddings[0],
            "metadata": test_document_metadatas[0],
        },
        {
            "id": "b",
            "embeddings": test_embeddings[1],
            "metadata": test_document_metadatas[1],
        },
    ]

    mock_writer.column_update(
        ids=ids, embeddings=test_embeddings, document_metadatas=test_document_metadatas
    )

    update_mock.assert_called_once_with(
        documents=expected_update_document,
        collection_id=None,
        collection_name=None,
    )


@patch("starpoint.writer.Writer.update")
def test_writer_column_update_collection_id_collection_name_passed_through(
    update_mock: MagicMock, mock_writer: writer.Writer
):
    ids = ["a"]
    test_embeddings = [{"values": [0.88], "dimensionality": 1}]
    test_document_metadatas = [{"mock": "metadata"}]
    expected_update_document = [
        {
            "id": "a",
            "embeddings": test_embeddings[0],
            "metadata": test_document_metadatas[0],
        },
    ]
    expected_collection_id = "mock_id"
    expected_collection_name = "mock_name"

    mock_writer.column_update(
        ids=ids,
        embeddings=test_embeddings,
        document_metadatas=test_document_metadatas,
        collection_id=expected_collection_id,
        collection_name=expected_collection_name,
    )

    update_mock.assert_called_once_with(
        documents=expected_update_document,
        collection_id=expected_collection_id,
        collection_name=expected_collection_name,
    )


@patch("starpoint.writer.Writer.update")
def test_writer_column_insert_shorter_metadatas_length(
    update_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    ids = ["a", "b"]
    test_embeddings = [
        {"values": [0.88], "dimensionality": 1},
        {"values": [0.71], "dimensionality": 1},
    ]
    test_document_metadatas = [{"mock": "metadata"}]
    expected_update_document = [
        {
            "id": "a",
            "embeddings": test_embeddings[0],
            "metadata": test_document_metadatas[0],
        },
    ]

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    mock_writer.column_update(
        ids=ids, embeddings=test_embeddings, document_metadatas=test_document_metadatas
    )

    logger_mock.warning.assert_called_once_with(
        writer.EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING
    )
    update_mock.assert_called_once_with(
        documents=expected_update_document,
        collection_id=None,
        collection_name=None,
    )


@patch("starpoint.writer.Writer.update")
def test_writer_column_update_shorter_embeddings_length(
    update_mock: MagicMock, mock_writer: writer.Writer, monkeypatch: MonkeyPatch
):
    ids = ["a", "b"]
    test_embeddings = [
        {"values": [0.88], "dimensionality": 1},
    ]
    test_document_metadatas = [{"mock": "metadata"}, {"mock2": "metadata2"}]
    expected_update_document = [
        {
            "id": "a",
            "embeddings": test_embeddings[0],
            "metadata": test_document_metadatas[0],
        },
    ]

    logger_mock = MagicMock()
    monkeypatch.setattr(writer, "LOGGER", logger_mock)

    mock_writer.column_update(
        ids=ids, embeddings=test_embeddings, document_metadatas=test_document_metadatas
    )

    logger_mock.warning.assert_called_once_with(
        writer.EMBEDDING_METADATA_LENGTH_MISMATCH_WARNING
    )
    update_mock.assert_called_once_with(
        documents=expected_update_document,
        collection_id=None,
        collection_name=None,
    )
