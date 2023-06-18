from uuid import UUID, uuid4
from unittest.mock import MagicMock, patch

import pytest

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


def test__set_and_validate_host_no_host():
    with pytest.raises(ValueError, match=db.NO_HOST_ERROR):
        db._set_and_validate_host(host="")


@pytest.mark.parametrize(
    "test_host", ("asdf", "pdf://www.example.com", "www.example.com")
)
def test__set_and_validate_host_invalid_url(test_host):
    with pytest.raises(ValueError, match=r".*not a valid url format"):
        db._set_and_validate_host(host=test_host)


@pytest.mark.parametrize(
    "test_host", ("http://www.example.com/", "http://www.example.com//")
)
def test__set_and_validate_host_dangling_backslash_trimmed(test_host):
    expected_hostname = "http://www.example.com"

    actual_hostname = db._set_and_validate_host(host=test_host)

    assert actual_hostname == expected_hostname


@pytest.mark.parametrize(
    "test_host", ("http://www.example.com", "https://www.example.com")
)
def test__set_and_validate_host_simple_valid_url(test_host):
    expected_hostname = test_host

    actual_hostname = db._set_and_validate_host(host=test_host)

    assert actual_hostname == expected_hostname


def test__check_collection_identifier_collision_neither_value():
    with pytest.raises(ValueError, match=db.NO_COLLECTION_VALUE_ERROR):
        db._check_collection_identifier_collision()


def test__check_collection_identifier_collision_both_value():
    with pytest.raises(ValueError, match=db.MULTI_COLLECTION_VALUE_ERROR):
        db._check_collection_identifier_collision(
            collection_id=uuid4(), collection_name="test_collection_name"
        )


@pytest.fixture
def composer_uuid() -> UUID:
    return uuid4()


@pytest.fixture
def composer(composer_uuid: UUID) -> db.Composer:
    return db.Composer(composer_uuid)


def test_composer_default_init(composer: db.Composer, composer_uuid: UUID):
    assert composer.host
    assert composer.host == db.COMPOSER_URL
    assert composer.api_key == composer_uuid


def test_composer_init_non_default_host(composer_uuid: UUID):
    test_host = "http://www.example.com"
    composer = db.Composer(api_key=composer_uuid, host=test_host)

    assert composer.host
    assert composer.host == test_host
    assert composer.api_key == composer_uuid


@patch("starpoint.db.requests")
def test_composer_delete_by_collection_id(
    request_mock: MagicMock, composer: db.Composer
):
    composer.delete(documents=[uuid4()], collection_id=uuid4())

    request_mock.delete.assert_called_once()


@patch("starpoint.db.requests")
def test_composer_delete_by_collection_name(
    request_mock: MagicMock, composer: db.Composer
):
    composer.delete(documents=[uuid4()], collection_name="mock_collection_name")

    request_mock.delete.assert_called_once()


@patch("starpoint.db.requests")
def test_composer_delete_not_200(request_mock: MagicMock, composer: db.Composer):
    request_mock.delete().ok = False

    expected_json = {}

    actual_json = composer.delete(
        documents=[uuid4()], collection_name="mock_collection_name"
    )

    request_mock.delete.assert_called()
    assert actual_json == expected_json


@patch("starpoint.db.requests")
def test_composer_insert_by_collection_id(
    request_mock: MagicMock, composer: db.Composer
):
    composer.insert(documents=[uuid4()], collection_id=uuid4())

    request_mock.post.assert_called_once()


@patch("starpoint.db.requests")
def test_composer_insert_by_collection_name(
    request_mock: MagicMock, composer: db.Composer
):
    composer.insert(documents=[uuid4()], collection_name="mock_collection_name")

    request_mock.post.assert_called_once()


@patch("starpoint.db.requests")
def test_composer_insert_not_200(request_mock: MagicMock, composer: db.Composer):
    request_mock.post().ok = False

    expected_json = {}

    actual_json = composer.insert(
        documents=[uuid4()], collection_name="mock_collection_name"
    )

    request_mock.post.assert_called()
    assert actual_json == expected_json


@patch("starpoint.db.requests")
def test_composer_update_by_collection_id(
    request_mock: MagicMock, composer: db.Composer
):
    composer.update(documents=[uuid4()], collection_id=uuid4())

    request_mock.patch.assert_called_once()


@patch("starpoint.db.requests")
def test_composer_update_by_collection_name(
    request_mock: MagicMock, composer: db.Composer
):
    composer.update(documents=[uuid4()], collection_name="mock_collection_name")

    request_mock.patch.assert_called_once()


@patch("starpoint.db.requests")
def test_composer_update_not_200(request_mock: MagicMock, composer: db.Composer):
    request_mock.patch().ok = False

    expected_json = {}

    actual_json = composer.update(
        documents=[uuid4()], collection_name="mock_collection_name"
    )

    request_mock.patch.assert_called()
    assert actual_json == expected_json
