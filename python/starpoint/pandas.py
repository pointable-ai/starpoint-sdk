import logging

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

    def insert_dataframe(self, dataframe: pd.DataFrame):
        if len(dataframe.columns) > 2:
            LOGGER.warning(TOO_MANY_COLUMN_WARNING)
        elif len(dataframe.columns) < 2:
            raise ValueError("")

        try:
            embedding_column_index = dataframe.columns.get_loc("embedding")
        except KeyError as e:
            raise KeyError(MISSING_COLUMN) from e

        try:
            metadata_column_index = dataframe.columns.get_loc("metadata")
        except KeyError as e:
            raise KeyError(MISSING_COLUMN) from e
