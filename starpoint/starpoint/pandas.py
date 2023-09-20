import logging
from string import Template
from typing import Any, Dict, List, Optional

import pandas as pd

from starpoint import db

LOGGER = logging.getLogger(__name__)

EMBEDDING_COLUMN_NAME = "embedding"

TOO_FEW_COLUMN_ERROR = """Not enough columns in dataframe provided. Please make sure to provide a
column for at least embeddings. For examples of what this should look like visit:
https://docs.starpoint.ai/"""
MISSING_COLUMN = Template(
    'Missing column name "$column_name" expected for starpoint write operations.'
)


def _check_column_length(dataframe: pd.DataFrame):
    """Checks that, by length, we satisfy basic requirements for a starpoint write operation.
    For any starpoint write operations, we need at least the embeddings column.
    """
    if len(dataframe.columns) < 1:
        raise ValueError(TOO_FEW_COLUMN_ERROR)


def _get_aggregate_column_values_from_dataframe(
    dataframe: pd.DataFrame, exclude_column_names: List[str]
) -> List[Dict]:
    """Gets a dataframe of everything except for the "embedding" column then produce
    a list of row-wise dicts that will be loaded as the metadata. For example:

    df = DataFrame([[1,2,3], [4,5,6]], columns=["embedding","b","c"]
    metadata_column_values will be [{'b': 2, 'c': 3}, {'b': 5, 'c': 6}]
    """
    if not all((True if name in dataframe else False for name in exclude_column_names)):
        raise ValueError(
            f"{exclude_column_names} has values that does not exist in "
            "the dataframe and cannot be excluded."
        )

    metadatas_df = dataframe.loc[:, ~dataframe.columns.isin(exclude_column_names)]
    return metadatas_df.to_dict(orient="records")


def _get_column_value_from_dataframe(dataframe: pd.DataFrame, column_name: str) -> List:
    try:
        column = dataframe[column_name]
    except KeyError as e:
        e.add_note(MISSING_COLUMN.substitute(column_name=column_name))
        raise
    # TODO: check values using df to make sure values aren't totally bogus
    return column.values.tolist()


class PandasClient(object):
    def __init__(
        self,
        starpoint: db.Client,
    ):
        self.starpoint = starpoint

    def insert_by_dataframe(
        self,
        dataframe: pd.DataFrame,
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
        embedding_column_name: str = EMBEDDING_COLUMN_NAME,
    ) -> Dict[Any, Any]:
        _check_column_length(dataframe)
        embedding_column_values = _get_column_value_from_dataframe(
            dataframe,
            embedding_column_name,
        )

        metadata_column_values = _get_aggregate_column_values_from_dataframe(
            dataframe,
            [embedding_column_name],
        )

        self.starpoint.column_insert(
            embeddings=embedding_column_values,
            document_metadatas=metadata_column_values,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def update_by_dataframe(
        self,
        dataframe: pd.DataFrame,
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
        embedding_column_name: str = EMBEDDING_COLUMN_NAME,
    ) -> Dict[Any, Any]:
        _check_column_length(dataframe)
        embedding_column_values = _get_column_value_from_dataframe(
            dataframe,
            embedding_column_name,
        )

        metadata_column_values = _get_aggregate_column_values_from_dataframe(
            dataframe,
            [embedding_column_name],
        )

        self.starpoint.column_update(
            embeddings=embedding_column_values,
            document_metadatas=metadata_column_values,
            collection_id=collection_id,
            collection_name=collection_name,
        )

    def delete_by_dataframe(
        self,
        dataframe: pd.DataFrame,
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
        embedding_column_name: str = EMBEDDING_COLUMN_NAME,
    ) -> Dict[Any, Any]:
        _check_column_length(dataframe)
        embedding_column_values = _get_column_value_from_dataframe(
            dataframe,
            embedding_column_name,
        )

        metadata_column_values = _get_aggregate_column_values_from_dataframe(
            dataframe,
            [embedding_column_name],
        )

        self.starpoint.column_delete(
            embeddings=embedding_column_values,
            document_metadatas=metadata_column_values,
            collection_id=collection_id,
            collection_name=collection_name,
        )
