from uuid import uuid4

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

    actual_header = db._build_header(api_key=test_uuid, additional_headers=additional_header)

    assert actual_header == expected_header


def test__set_and_validate_host():
    ...

def test__check_collection_identifier_collision():
    ...