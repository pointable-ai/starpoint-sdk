from uuid import uuid4
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest
from _pytest.monkeypatch import MonkeyPatch

from starpoint import pandas


def test__check_column_lenth_too_many_columns(monkeypatch: MonkeyPatch):
    """Tests that when there are too many columns a warning is logged, but
    exception is not raised."""
    too_many_column_dataframe = pd.DataFrame(
        [[1, 2, 3]],
        columns=["embedding", "metadata", "extra"],
    )

    logger_mock = MagicMock()
    monkeypatch.setattr(pandas, "LOGGER", logger_mock)
    pandas._check_column_length(too_many_column_dataframe)


@pytest.mark.parametrize("dataframe_columns", [[], [[1]], [[1], [2]]])
def test__check_column_lenth_too_few_columns(dataframe_columns):
    too_few_column_dataframe = pd.DataFrame(dataframe_columns)

    with pytest.raises(ValueError, match=pandas.TOO_FEW_COLUMN_ERROR):
        pandas._check_column_length(too_few_column_dataframe)


def test_init_pandas_client():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    assert pandas_client.starpoint == mock_startpoint_client


def test_insert_by_dataframe_too_many_columns(monkeypatch: MonkeyPatch):
    """Tests that when there are too many columns a warning is logged, but
    exception is not raised."""
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    too_many_column_dataframe = pd.DataFrame(
        [[1, 2, 3]],
        columns=["embedding", "metadata", "extra"],
    )

    logger_mock = MagicMock()
    monkeypatch.setattr(pandas, "LOGGER", logger_mock)
    pandas_client.insert_by_dataframe(too_many_column_dataframe)

    mock_startpoint_client.column_insert.assert_called_once()


def test_insert_by_dataframe_missing_embedding_column():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    missing_embedding_column_dataframe = pd.DataFrame(
        [[1, 2]],
        columns=["metadata", "extra"],
    )

    with pytest.raises(KeyError) as excinfo:
        pandas_client.insert_by_dataframe(missing_embedding_column_dataframe)

    assert (
        pandas.MISSING_COLUMN.substitute(column_name="embedding")
        in excinfo.value.__notes__
    )


def test_insert_by_dataframe_missing_metadata_column():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    missing_metadata_column_dataframe = pd.DataFrame(
        [[1, 2]],
        columns=["embedding", "extra"],
    )

    with pytest.raises(KeyError) as excinfo:
        pandas_client.insert_by_dataframe(missing_metadata_column_dataframe)

    assert (
        pandas.MISSING_COLUMN.substitute(column_name="metadata")
        in excinfo.value.__notes__
    )
