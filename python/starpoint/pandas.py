import logging
from typing import Any, Dict, Optional

import pandas as pd

from starpoint import db

LOGGER = logging.getLogger(__name__)

TOO_MANY_COLUMN_WARNING = "More than 2 columns given in dataframe. Only columns for embedding and metadata will be ingested."
TOO_FEW_COLUMN_ERROR = """Not enough columns in dataframe provided. Please make sure to provide a
column for both embeddings and metadata. For examples of what this should look like visit:
https://docs.starpoint.ai/"""
MISSING_COLUMN = "Missing column name expected for insertion."


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
    ) -> Dict[Any, Any]:
        if len(dataframe.columns) > 2:
            LOGGER.warning(TOO_MANY_COLUMN_WARNING)
        elif len(dataframe.columns) < 2:
            raise ValueError(TOO_FEW_COLUMN_ERROR)

        try:
            embedding_column = dataframe["embedding"]
        except KeyError as e:
            e.add_note(MISSING_COLUMN)
            e.add_note('Missing column: "embedding"')
            raise
        # TODO: check values using df to make sure values aren't totally bogus
        embedding_column_values = embedding_column.values.tolist()

        try:
            metadata_column = dataframe["metadata"]
        except KeyError as e:
            e.add_note(MISSING_COLUMN)
            e.add_note('Missing column: "metadata"')
            raise
        # TODO: check values using df to make sure values aren't totally bogus
        metadata_column_values = metadata_column.values.tolist()

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
    ) -> Dict[Any, Any]:
        if len(dataframe.columns) > 2:
            LOGGER.warning(TOO_MANY_COLUMN_WARNING)
        elif len(dataframe.columns) < 2:
            raise ValueError(TOO_FEW_COLUMN_ERROR)

        try:
            embedding_column = dataframe["embedding"]
        except KeyError as e:
            e.add_note(MISSING_COLUMN)
            e.add_note('Missing column: "embedding"')
            raise
        # TODO: check values using df to make sure values aren't totally bogus
        embedding_column_values = embedding_column.values.tolist()

        try:
            metadata_column = dataframe["metadata"]
        except KeyError as e:
            e.add_note(MISSING_COLUMN)
            e.add_note('Missing column: "metadata"')
            raise
        # TODO: check values using df to make sure values aren't totally bogus
        metadata_column_values = metadata_column.values.tolist()

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
    ) -> Dict[Any, Any]:
        if len(dataframe.columns) > 2:
            LOGGER.warning(TOO_MANY_COLUMN_WARNING)
        elif len(dataframe.columns) < 2:
            raise ValueError(TOO_FEW_COLUMN_ERROR)

        try:
            embedding_column = dataframe["embedding"]
        except KeyError as e:
            e.add_note(MISSING_COLUMN)
            e.add_note('Missing column: "embedding"')
            raise
        # TODO: check values using df to make sure values aren't totally bogus
        embedding_column_values = embedding_column.values.tolist()

        try:
            metadata_column = dataframe["metadata"]
        except KeyError as e:
            e.add_note(MISSING_COLUMN)
            e.add_note('Missing column: "metadata"')
            raise
        # TODO: check values using df to make sure values aren't totally bogus
        metadata_column_values = metadata_column.values.tolist()

        self.starpoint.column_delete(
            embeddings=embedding_column_values,
            document_metadatas=metadata_column_values,
            collection_id=collection_id,
            collection_name=collection_name,
        )
