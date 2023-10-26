from typing import List
from uuid import uuid4
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from starpoint import pandas


def test__check_column_lenth_too_few_columns():
    too_few_column_dataframe = pd.DataFrame([])

    with pytest.raises(ValueError, match=pandas.TOO_FEW_COLUMN_ERROR):
        pandas._check_column_length(too_few_column_dataframe)


def test__get_aggregate_column_values_from_dataframe_exclude_partial():
    test_dataframe = pd.DataFrame([[1, 2], [3, 4]], columns=["include", "exclude"])

    expected_list = [{"include": 1}, {"include": 3}]

    actual_list = pandas._get_aggregate_column_values_from_dataframe(
        test_dataframe, ["exclude"]
    )

    assert actual_list == expected_list


def test__get_aggregate_column_values_from_dataframe_exclude_all():
    test_dataframe = pd.DataFrame([[1, 2], [3, 4]], columns=["exclude1", "exclude2"])

    actual_list = pandas._get_aggregate_column_values_from_dataframe(
        test_dataframe, ["exclude1", "exclude2"]
    )

    assert actual_list == []


@pytest.mark.parametrize("exclude_columns", [["random col"], ["exclude", "random col"]])
def test__get_aggregate_column_values_from_dataframe_exclude_unrelated(exclude_columns):
    test_dataframe = pd.DataFrame([[1, 2], [3, 4]], columns=["include", "exclude"])

    with pytest.raises(ValueError):
        pandas._get_aggregate_column_values_from_dataframe(
            test_dataframe, exclude_columns
        )


def test_init_pandas_client():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    assert pandas_client.starpoint == mock_startpoint_client


@patch("starpoint.pandas._check_column_length")
def test_insert_by_dataframe_success(check_column_mock: MagicMock):
    """Tests a successful insertion operation."""
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    test_dataframe = pd.DataFrame(
        [[1, 2]],
        columns=["embedding", "metadata"],
    )

    pandas_client.insert_by_dataframe(test_dataframe)

    check_column_mock.assert_called_once_with(test_dataframe)
    mock_startpoint_client.column_insert.assert_called_once_with(
        embeddings=[1],
        document_metadatas=[{"metadata": 2}],
        collection_id=None,
        collection_name=None,
    )


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


@patch("starpoint.pandas._check_column_length")
def test_update_by_dataframe_success(check_column_mock: MagicMock):
    """Tests a successful update operation."""
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    test_dataframe = pd.DataFrame(
        [[1, 2]],
        columns=["embedding", "metadata"],
    )

    pandas_client.update_by_dataframe(test_dataframe)

    check_column_mock.assert_called_once_with(test_dataframe)
    mock_startpoint_client.column_update.assert_called_once_with(
        embeddings=[1],
        document_metadatas=[{"metadata": 2}],
        collection_id=None,
        collection_name=None,
    )


def test_update_by_dataframe_missing_embedding_column():
    mock_startpoint_client = MagicMock()
    pandas_client = pandas.PandasClient(mock_startpoint_client)

    missing_embedding_column_dataframe = pd.DataFrame(
        [[1, 2]],
        columns=["metadata", "extra"],
    )

    with pytest.raises(KeyError) as excinfo:
        pandas_client.update_by_dataframe(missing_embedding_column_dataframe)

    assert (
        pandas.MISSING_COLUMN.substitute(column_name="embedding")
        in excinfo.value.__notes__
    )
