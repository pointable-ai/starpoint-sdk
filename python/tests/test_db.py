from uuid import uuid4

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
