from tempfile import NamedTemporaryFile
from uuid import uuid4
from unittest.mock import MagicMock, patch

import pytest
from _pytest.monkeypatch import MonkeyPatch

from starpoint import db


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_default_init(mock_writer: MagicMock, mock_reader: MagicMock):
    test_uuid = uuid4()

    client = db.Client(api_key=test_uuid)

    mock_writer.assert_called_once_with(api_key=test_uuid, host=None)
    mock_reader.assert_called_once_with(api_key=test_uuid, host=None)


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_delete(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.delete(documents=[uuid4()])

    mock_reader.assert_called_once()  # Only called during init
    mock_writer().delete.assert_called_once()


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_insert(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.insert(documents=[{"mock": "value"}])

    mock_reader.assert_called_once()  # Only called during init
    mock_writer().insert.assert_called_once()


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_column_insert(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.column_insert(embeddings=[{"values": [1.1], "dimensionality": 1}], document_metadatas=[{"mock": "value"}])

    mock_reader.assert_called_once()  # Only called during init
    mock_writer().column_insert.assert_called_once()


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_query(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.query()

    mock_writer.assert_called_once()  # Only called during init
    mock_reader().query.assert_called_once()


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_infer_schema(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.infer_schema()

    mock_writer.assert_called_once()  # Only called during init
    mock_reader().infer_schema.assert_called_once()


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_update(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.update(documents=[{"mock": "value"}])

    mock_reader.assert_called_once()  # Only called during init
    mock_writer().update.assert_called_once()


@patch("starpoint.reader.Reader")
@patch("starpoint.writer.Writer")
def test_client_column_update(mock_writer: MagicMock, mock_reader: MagicMock):
    client = db.Client(api_key=uuid4())

    client.column_update(embeddings=[{"values": [1.1], "dimensionality": 1}], document_metadatas=[{"mock": "value"}])
    mock_reader.assert_called_once()  # Only called during init
    mock_writer().column_update.assert_called_once()
