from uuid import uuid4
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest
from _pytest.monkeypatch import MonkeyPatch

from starpoint import pandas


def test_init_pandas_client():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    assert client.starpoint == mock_startpoint_client


# TODO: unskip once we finish the rest of the test
@pytest.mark.skip
def test_insert_by_dataframe_too_many_columns(monkeypatch: MonkeyPatch):
    """Tests that when there are too many columns a warning is logged, but except is not raised."""
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    too_many_column_dataframe = pd.DataFrame()

    logger_mock = MagicMock()
    monkeypatch.setattr(reader, "LOGGER", logger_mock)
    pandas_client.insert_by_dataframe(too_many_column_dataframe)


def test_insert_by_dataframe_too_few_columns():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    too_few_column_dataframe = pd.DataFrame()

    pandas_client.insert_by_dataframe(too_few_column_dataframe)


def test_insert_by_dataframe_identifier_collide():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)


def test_insert_by_dataframe_missing_embeddings_column():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)


def test_insert_by_dataframe_missing_metadata_column():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)
