from uuid import UUID, uuid4
from unittest.mock import MagicMock, patch

import pytest
from _pytest.monkeypatch import MonkeyPatch
from requests.exceptions import SSLError

from starpoint import reader


@pytest.fixture(scope="session")
def api_uuid() -> UUID:
    return uuid4()


@pytest.fixture(scope="session")
@patch("starpoint._utils._check_host_health")
def mock_reader(host_health_mock: MagicMock, api_uuid: UUID) -> reader.Reader:
    return reader.Reader(api_uuid)


def test_reader_default_init(mock_reader: reader.Reader, api_uuid: UUID):
    assert mock_reader.host
    assert mock_reader.host == reader.READER_URL
    assert mock_reader.api_key == api_uuid


@patch("starpoint.reader._set_and_validate_host")
def test_reader_init_non_default_host(mock_host_validator: MagicMock, api_uuid: UUID):
    test_host = "http://www.example.com"
    test_reader = reader.Reader(api_key=api_uuid, host=test_host)

    mock_host_validator.assert_called_once_with(test_host)
    # This assert needs to be after assert_called_once_with to make sure it doesn't confound the result
    assert test_reader.host == mock_host_validator()
    assert test_reader.api_key == api_uuid


@patch("starpoint.reader._check_collection_identifier_collision")
@patch("starpoint.reader.requests")
def test_reader_query_by_collection_id(
    requests_mock: MagicMock, collision_mock: MagicMock, mock_reader: reader.Reader
):
    test_uuid = uuid4()

    mock_reader.query(collection_id=test_uuid)

    collision_mock.assert_called_once_with(test_uuid, None)
    requests_mock.post.assert_called_once()


@patch("starpoint.reader._check_collection_identifier_collision")
@patch("starpoint.reader.requests")
def test_reader_query_by_collection_name(
    requests_mock: MagicMock, collision_mock: MagicMock, mock_reader: reader.Reader
):
    test_collection_name = "mock_collection_name"

    mock_reader.query(collection_name=test_collection_name)

    collision_mock.assert_called_once_with(None, test_collection_name)
    requests_mock.post.assert_called_once()


@patch("starpoint.reader.requests")
def test_reader_query_not_200(
    requests_mock: MagicMock, mock_reader: reader.Reader, monkeypatch: MonkeyPatch
):
    requests_mock.post().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(reader, "LOGGER", logger_mock)

    actual_json = mock_reader.query(collection_name="mock_collection_name")

    requests_mock.post.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.reader.requests")
def test_reader_infer_schema_200(
    requests_mock: MagicMock, mock_reader: reader.Reader, monkeypatch: MonkeyPatch
):
    actual_json = mock_reader.infer_schema(collection_name="mock_collection_name")

    requests_mock.post.assert_called()
    assert actual_json == requests_mock.post().json()


@patch("starpoint.reader.requests")
def test_reader_infer_schema_not_200(
    requests_mock: MagicMock, mock_reader: reader.Reader, monkeypatch: MonkeyPatch
):
    requests_mock.post().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(reader, "LOGGER", logger_mock)

    actual_json = mock_reader.infer_schema(collection_name="mock_collection_name")

    requests_mock.post.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.reader.requests")
def test_reader_query_SSLError(
    requests_mock: MagicMock, mock_reader: reader.Reader, monkeypatch: MonkeyPatch
):
    requests_mock.exceptions.SSLError = SSLError
    requests_mock.post.side_effect = SSLError("mock exception")

    logger_mock = MagicMock()
    monkeypatch.setattr(reader, "LOGGER", logger_mock)

    with pytest.raises(SSLError, match="mock exception"):
        mock_reader.query(collection_name="mock_collection_name")

    logger_mock.error.assert_called_once_with(reader.SSL_ERROR_MSG)
