from uuid import uuid4
from unittest.mock import MagicMock, patch

import pytest
from _pytest.monkeypatch import MonkeyPatch

from starpoint import _utils


def test__build_header_no_additional_header():
    test_uuid = uuid4()

    expected_header = {_utils.API_HEADER_KEY: str(test_uuid)}

    actual_header = _utils._build_header(api_key=test_uuid)

    assert actual_header == expected_header


def test__build_header_with_additional_header():
    test_uuid = uuid4()
    additional_header = {"test": "header"}

    expected_header = {_utils.API_HEADER_KEY: str(test_uuid)}
    expected_header.update(additional_header)

    actual_header = _utils._build_header(
        api_key=test_uuid, additional_headers=additional_header
    )

    assert actual_header == expected_header


@patch("starpoint._utils.requests")
def test__check_host_health_healty_host(requests_mock: MagicMock):
    mock_hostname = "mock_hostname"

    _utils._check_host_health(mock_hostname)

    requests_mock.get.assert_called_once_with(mock_hostname)


@patch("starpoint._utils.requests")
def test__check_host_health_not_200_host_assert(requests_mock: MagicMock):
    requests_mock.get().ok = False
    mock_hostname = "mock_hostname"

    with pytest.raises(AssertionError):
        _utils._check_host_health(mock_hostname)


@patch("starpoint._utils.requests")
def test__check_host_health_unhealthy_host_assert(
    requests_mock: MagicMock, monkeypatch: MonkeyPatch
):
    requests_mock.get().text = "unhealthy message"
    mock_hostname = "mock_hostname"

    logger_mock = MagicMock()
    monkeypatch.setattr(_utils, "LOGGER", logger_mock)

    _utils._check_host_health(mock_hostname)

    logger_mock.warning.assert_called_once()


def test__set_and_validate_host_no_host():
    with pytest.raises(ValueError, match=_utils.NO_HOST_ERROR):
        _utils._set_and_validate_host(host="")


@pytest.mark.parametrize(
    "test_host", ("asdf", "pdf://www.example.com", "www.example.com")
)
@patch("starpoint._utils._check_host_health")
def test__set_and_validate_host_invalid_url(
    host_health_mock: MagicMock, test_host: str
):
    with pytest.raises(ValueError, match=r".*not a valid url format"):
        _utils._set_and_validate_host(host=test_host)
    host_health_mock.assert_not_called()


@pytest.mark.parametrize(
    "test_host", ("http://www.example.com/", "http://www.example.com//")
)
@patch("starpoint._utils._check_host_health")
def test__set_and_validate_host_dangling_backslash_trimmed(
    host_health_mock: MagicMock, test_host: str
):
    expected_hostname = "http://www.example.com"

    actual_hostname = _utils._set_and_validate_host(host=test_host)

    assert actual_hostname == expected_hostname
    host_health_mock.assert_called_once_with(expected_hostname)


@pytest.mark.parametrize(
    "test_host", ("http://www.example.com", "https://www.example.com")
)
@patch("starpoint._utils._check_host_health")
def test__set_and_validate_host_simple_valid_url(
    host_health_mock: MagicMock, test_host: str
):
    expected_hostname = test_host

    actual_hostname = _utils._set_and_validate_host(host=test_host)

    assert actual_hostname == expected_hostname
    host_health_mock.assert_called_once_with(expected_hostname)


def test__check_collection_identifier_collision_neither_value():
    with pytest.raises(ValueError, match=_utils.NO_COLLECTION_VALUE_ERROR):
        _utils._check_collection_identifier_collision()


def test__check_collection_identifier_collision_both_value():
    with pytest.raises(ValueError, match=_utils.MULTI_COLLECTION_VALUE_ERROR):
        _utils._check_collection_identifier_collision(
            collection_id=uuid4(), collection_name="test_collection_name"
        )
