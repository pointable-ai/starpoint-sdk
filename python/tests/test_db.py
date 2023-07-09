from tempfile import NamedTemporaryFile
from uuid import UUID, uuid4
from unittest.mock import MagicMock, patch

import pytest
from _pytest.monkeypatch import MonkeyPatch
from requests.exceptions import SSLError

from starpoint import db


def test__build_header_no_additional_header():
    test_uuid = uuid4()

    expected_header = {db.API_HEADER_KEY: str(test_uuid)}

    actual_header = db._build_header(api_key=test_uuid)

    assert actual_header == expected_header


def test__build_header_with_additional_header():
    test_uuid = uuid4()
    additional_header = {"test": "header"}

    expected_header = {db.API_HEADER_KEY: str(test_uuid)}
    expected_header.update(additional_header)

    actual_header = db._build_header(
        api_key=test_uuid, additional_headers=additional_header
    )

    assert actual_header == expected_header


@patch("starpoint.db.requests")
def test__check_host_health_healty_host(requests_mock: MagicMock):
    mock_hostname = "mock_hostname"

    db._check_host_health(mock_hostname)

    requests_mock.get.assert_called_once_with(mock_hostname)


@patch("starpoint.db.requests")
def test__check_host_health_not_200_host_assert(requests_mock: MagicMock):
    requests_mock.get().ok = False
    mock_hostname = "mock_hostname"

    with pytest.raises(AssertionError):
        db._check_host_health(mock_hostname)


@patch("starpoint.db.requests")
def test__check_host_health_unhealthy_host_assert(
    requests_mock: MagicMock, monkeypatch: MonkeyPatch
):
    requests_mock.get().text = "unhealthy message"
    mock_hostname = "mock_hostname"

    logger_mock = MagicMock()
    monkeypatch.setattr(db, "LOGGER", logger_mock)

    db._check_host_health(mock_hostname)

    logger_mock.warning.assert_called_once()


def test__set_and_validate_host_no_host():
    with pytest.raises(ValueError, match=db.NO_HOST_ERROR):
        db._set_and_validate_host(host="")


@pytest.mark.parametrize(
    "test_host", ("asdf", "pdf://www.example.com", "www.example.com")
)
@patch("starpoint.db._check_host_health")
def test__set_and_validate_host_invalid_url(
    host_health_mock: MagicMock, test_host: str
):
    with pytest.raises(ValueError, match=r".*not a valid url format"):
        db._set_and_validate_host(host=test_host)
    host_health_mock.assert_not_called()


@pytest.mark.parametrize(
    "test_host", ("http://www.example.com/", "http://www.example.com//")
)
@patch("starpoint.db._check_host_health")
def test__set_and_validate_host_dangling_backslash_trimmed(
    host_health_mock: MagicMock, test_host: str
):
    expected_hostname = "http://www.example.com"

    actual_hostname = db._set_and_validate_host(host=test_host)

    assert actual_hostname == expected_hostname
    host_health_mock.assert_called_once_with(expected_hostname)


@pytest.mark.parametrize(
    "test_host", ("http://www.example.com", "https://www.example.com")
)
@patch("starpoint.db._check_host_health")
def test__set_and_validate_host_simple_valid_url(
    host_health_mock: MagicMock, test_host: str
):
    expected_hostname = test_host

    actual_hostname = db._set_and_validate_host(host=test_host)

    assert actual_hostname == expected_hostname
    host_health_mock.assert_called_once_with(expected_hostname)


def test__check_collection_identifier_collision_neither_value():
    with pytest.raises(ValueError, match=db.NO_COLLECTION_VALUE_ERROR):
        db._check_collection_identifier_collision()


def test__check_collection_identifier_collision_both_value():
    with pytest.raises(ValueError, match=db.MULTI_COLLECTION_VALUE_ERROR):
        db._check_collection_identifier_collision(
            collection_id=uuid4(), collection_name="test_collection_name"
        )


@pytest.fixture(scope="session")
def api_uuid() -> UUID:
    return uuid4()


@pytest.fixture(scope="session")
@patch("starpoint.db._check_host_health")
def writer(host_health_mock: MagicMock, api_uuid: UUID) -> db.Writer:
    return db.Writer(api_uuid)


def test_writer_default_init(writer: db.Writer, api_uuid: UUID):
    assert writer.host
    assert writer.host == db.COMPOSER_URL
    assert writer.api_key == api_uuid


def test_writer_init_non_default_host(api_uuid: UUID):
    test_host = "http://www.example.com"
    writer = db.Writer(api_key=api_uuid, host=test_host)

    assert writer.host
    assert writer.host == test_host
    assert writer.api_key == api_uuid


@patch("starpoint.db._check_collection_identifier_collision")
@patch("starpoint.db.requests")
def test_writer_delete_by_collection_id(
    request_mock: MagicMock, collision_mock: MagicMock, writer: db.Writer
):
    test_uuid = uuid4()

    writer.delete(documents=[uuid4()], collection_id=test_uuid)

    collision_mock.assert_called_once_with(test_uuid, None)
    request_mock.delete.assert_called_once()


@patch("starpoint.db._check_collection_identifier_collision")
@patch("starpoint.db.requests")
def test_writer_delete_by_collection_name(
    request_mock: MagicMock, collision_mock: MagicMock, writer: db.Writer
):
    test_collection_name = "mock_collection_name"

    writer.delete(documents=[uuid4()], collection_name=test_collection_name)

    collision_mock.assert_called_once_with(None, test_collection_name)
    request_mock.delete.assert_called_once()


@patch("starpoint.db.requests")
def test_writer_delete_not_200(
    request_mock: MagicMock, writer: db.Writer, monkeypatch: MonkeyPatch
):
    request_mock.delete().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(db, "LOGGER", logger_mock)

    actual_json = writer.delete(
        documents=[uuid4()], collection_name="mock_collection_name"
    )

    request_mock.delete.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.db.requests")
def test_writer_delete_SSLError(
    request_mock: MagicMock, writer: db.Writer, monkeypatch: MonkeyPatch
):
    request_mock.exceptions.SSLError = SSLError
    request_mock.delete.side_effect = SSLError("mock exception")

    logger_mock = MagicMock()
    monkeypatch.setattr(db, "LOGGER", logger_mock)

    with pytest.raises(SSLError, match="mock exception"):
        writer.delete(documents=[uuid4()], collection_name="mock_collection_name")

    logger_mock.error.assert_called_once_with(db.SSL_ERROR_MSG)


@patch("starpoint.db._check_collection_identifier_collision")
@patch("starpoint.db.requests")
def test_writer_insert_by_collection_id(
    request_mock: MagicMock, collision_mock: MagicMock, writer: db.Writer
):
    test_uuid = uuid4()

    writer.insert(documents=[uuid4()], collection_id=test_uuid)

    collision_mock.assert_called_once_with(test_uuid, None)
    request_mock.post.assert_called_once()


@patch("starpoint.db._check_collection_identifier_collision")
@patch("starpoint.db.requests")
def test_writer_insert_by_collection_name(
    request_mock: MagicMock, collision_mock: MagicMock, writer: db.Writer
):
    test_collection_name = "mock_collection_name"

    writer.insert(documents=[uuid4()], collection_name=test_collection_name)

    collision_mock.assert_called_once_with(None, test_collection_name)
    request_mock.post.assert_called_once()


@patch("starpoint.db.requests")
def test_writer_insert_not_200(
    request_mock: MagicMock, writer: db.Writer, monkeypatch: MonkeyPatch
):
    request_mock.post().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(db, "LOGGER", logger_mock)

    actual_json = writer.insert(
        documents=[uuid4()], collection_name="mock_collection_name"
    )

    request_mock.post.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.db.requests")
def test_writer_insert_SSLError(
    request_mock: MagicMock, writer: db.Writer, monkeypatch: MonkeyPatch
):
    request_mock.exceptions.SSLError = SSLError
    request_mock.post.side_effect = SSLError("mock exception")

    logger_mock = MagicMock()
    monkeypatch.setattr(db, "LOGGER", logger_mock)

    with pytest.raises(SSLError, match="mock exception"):
        writer.insert(documents=[uuid4()], collection_name="mock_collection_name")

    logger_mock.error.assert_called_once_with(db.SSL_ERROR_MSG)


@patch("starpoint.db._check_collection_identifier_collision")
@patch("starpoint.db.requests")
def test_writer_update_by_collection_id(
    request_mock: MagicMock, collision_mock: MagicMock, writer: db.Writer
):
    test_uuid = uuid4()

    writer.update(documents=[uuid4()], collection_id=test_uuid)

    collision_mock.assert_called_once_with(test_uuid, None)
    request_mock.patch.assert_called_once()


@patch("starpoint.db._check_collection_identifier_collision")
@patch("starpoint.db.requests")
def test_writer_update_by_collection_name(
    request_mock: MagicMock, collision_mock: MagicMock, writer: db.Writer
):
    test_collection_name = "mock_collection_name"

    writer.update(documents=[uuid4()], collection_name=test_collection_name)

    collision_mock.assert_called_once_with(None, test_collection_name)
    request_mock.patch.assert_called_once()


@patch("starpoint.db.requests")
def test_writer_update_not_200(
    request_mock: MagicMock, writer: db.Writer, monkeypatch: MonkeyPatch
):
    request_mock.patch().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(db, "LOGGER", logger_mock)

    actual_json = writer.update(
        documents=[uuid4()], collection_name="mock_collection_name"
    )

    request_mock.patch.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.db.requests")
def test_writer_update_SSLError(
    request_mock: MagicMock, writer: db.Writer, monkeypatch: MonkeyPatch
):
    request_mock.exceptions.SSLError = SSLError
    request_mock.patch.side_effect = SSLError("mock exception")

    logger_mock = MagicMock()
    monkeypatch.setattr(db, "LOGGER", logger_mock)

    with pytest.raises(SSLError, match="mock exception"):
        writer.update(documents=[uuid4()], collection_name="mock_collection_name")

    logger_mock.error.assert_called_once_with(db.SSL_ERROR_MSG)


@pytest.fixture(scope="session")
@patch("starpoint.db._check_host_health")
def reader(host_health_mock: MagicMock, api_uuid: UUID) -> db.Reader:
    return db.Reader(api_uuid)


def test_reader_default_init(reader: db.Reader, api_uuid: UUID):
    assert reader.host
    assert reader.host == db.READER_URL
    assert reader.api_key == api_uuid


def test_reader_init_non_default_host(api_uuid: UUID):
    test_host = "http://www.example.com"
    reader = db.Reader(api_key=api_uuid, host=test_host)

    assert reader.host
    assert reader.host == test_host
    assert reader.api_key == api_uuid


@patch("starpoint.db._check_collection_identifier_collision")
@patch("starpoint.db.requests")
def test_reader_query_by_collection_id(
    request_mock: MagicMock, collision_mock: MagicMock, reader: db.Writer
):
    test_uuid = uuid4()

    reader.query(collection_id=test_uuid)

    collision_mock.assert_called_once_with(test_uuid, None)
    request_mock.post.assert_called_once()


@patch("starpoint.db._check_collection_identifier_collision")
@patch("starpoint.db.requests")
def test_reader_query_by_collection_name(
    request_mock: MagicMock, collision_mock: MagicMock, reader: db.Writer
):
    test_collection_name = "mock_collection_name"

    reader.query(collection_name=test_collection_name)

    collision_mock.assert_called_once_with(None, test_collection_name)
    request_mock.post.assert_called_once()


@patch("starpoint.db.requests")
def test_reader_query_not_200(
    request_mock: MagicMock, reader: db.Writer, monkeypatch: MonkeyPatch
):
    request_mock.post().ok = False

    expected_json = {}

    logger_mock = MagicMock()
    monkeypatch.setattr(db, "LOGGER", logger_mock)

    actual_json = reader.query(collection_name="mock_collection_name")

    request_mock.post.assert_called()
    logger_mock.error.assert_called_once()
    assert actual_json == expected_json


@patch("starpoint.db.requests")
def test_writer_query_SSLError(
    request_mock: MagicMock, reader: db.Reader, monkeypatch: MonkeyPatch
):
    request_mock.exceptions.SSLError = SSLError
    request_mock.post.side_effect = SSLError("mock exception")

    logger_mock = MagicMock()
    monkeypatch.setattr(db, "LOGGER", logger_mock)

    with pytest.raises(SSLError, match="mock exception"):
        reader.query(collection_name="mock_collection_name")

    logger_mock.error.assert_called_once_with(db.SSL_ERROR_MSG)


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_default_init(mock_writer: MagicMock, mock_reader: MagicMock):
    test_uuid = uuid4()

    client = db.Client(api_key=test_uuid)

    mock_writer.assert_called_once_with(api_key=test_uuid, host=None)
    mock_reader.assert_called_once_with(api_key=test_uuid, host=None)


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_delete(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.delete(documents=[uuid4()])

    mock_reader.assert_called_once()  # Only called during init
    mock_writer().delete.assert_called_once()


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_insert(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.insert(documents=[{"mock": "value"}])

    mock_reader.assert_called_once()  # Only called during init
    mock_writer().insert.assert_called_once()


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_transpose_and_insert(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.transpose_and_insert(embeddings=[1.1], document_metadatas={"mock": "value"})

    mock_reader.assert_called_once()  # Only called during init
    mock_writer().transpose_and_insert.assert_called_once()


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_query(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.query()

    mock_writer.assert_called_once()  # Only called during init
    mock_reader().query.assert_called_once()


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_update(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.update(documents=[{"mock": "value"}])

    mock_reader.assert_called_once()  # Only called during init
    mock_writer().update.assert_called_once()


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_init_openai_no_api_value(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    client = db.Client(api_key=uuid4())

    with pytest.raises(ValueError, match=db.NO_API_KEY_VALUE_ERROR):
        client.init_openai()

    assert client.openai is None


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_init_openai_no_api_value(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    client = db.Client(api_key=uuid4())

    with pytest.raises(ValueError, match=db.MULTI_API_KEY_VALUE_ERROR):
        client.init_openai("mock_key", "mock_path")

    assert client.openai is None


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_init_openai_with_api_key(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    mock_api_key = "mock_key"

    client = db.Client(api_key=uuid4())

    client.init_openai(openai_key=mock_api_key)

    assert client.openai.api_key == mock_api_key


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_init_openai_with_api_path(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    temp_file = NamedTemporaryFile()

    client = db.Client(api_key=uuid4())
    client.init_openai(openai_key_filepath=temp_file.name)

    assert client.openai.api_key_path == temp_file.name


@patch("starpoint.db.Reader")
@patch("starpoint.db.Writer")
def test_client_init_openai_with_bad_api_path(
    mock_writer: MagicMock, mock_reader: MagicMock
):
    mock_api_key_path = "1234~/path"

    client = db.Client(api_key=uuid4())
    with pytest.raises(ValueError, match=db.NO_API_KEY_FILE_ERROR):
        client.init_openai(openai_key_filepath=mock_api_key_path)

    assert client.openai is None
