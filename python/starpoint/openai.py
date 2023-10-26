import logging
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Union

import openai

from starpoint import db, _utils

LOGGER = logging.getLogger(__name__)


NO_API_KEY_VALUE_ERROR = "Please provide at least one value for either api_key or filepath where the api key lives."
MULTI_API_KEY_VALUE_ERROR = "Please only provide either api_key or filepath with the api_key in your initialization."
NO_API_KEY_FILE_ERROR = "The provided filepath for the API key is not a valid file."

# OpenAI response error
NO_EMBEDDING_DATA_FOUND = (
    "No embedding data found in the embedding response from OpenAI."
)

DEFAULT_OPENAI_MODEL = "text-embedding-ada-002"


class OpenAIClient(object):
    def __init__(
        self,
        starpoint: db.Client,
        openai_key: Optional[str] = None,
        openai_key_filepath: Optional[str] = None,
    ):
        self.starpoint = starpoint
        self._init_openai(openai_key, openai_key_filepath)

    def _init_openai(
        self,
        openai_key: Optional[str] = None,
        openai_key_filepath: Optional[str] = None,
    ):
        """Initializes OpenAI functionality by setting up the openai client.

        Args:
            openai_key: OpenAI API key.
            openai_key_filepath: Filepath that contains an OpenAI API key.

        Raises:
            ValueError: Both API key and filepath to API key is provided. Only one is allowed.
            ValueError: No API key or filepath provided.
            ValueError: API key filepath provided is not a file.
        """
        self.openai = openai
        # TODO: maybe do this for starpoint api_key also

        if openai_key and openai_key_filepath:
            raise ValueError(MULTI_API_KEY_VALUE_ERROR)
        elif openai_key is None:
            if openai_key_filepath is None:
                raise ValueError(NO_API_KEY_VALUE_ERROR)
            if not Path(openai_key_filepath).is_file():
                raise ValueError(NO_API_KEY_FILE_ERROR)
            self.openai.api_key_path = openai_key_filepath
        else:
            self.openai.api_key = openai_key

    def build_and_insert_embeddings(
        self,
        model: str,
        input_data: Union[str, Iterable[Any]],
        document_metadatas: Optional[List[Dict[Any, Any]]] = None,
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
        openai_user: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Builds and inserts embeddings into starpoint by requesting embedding creation from
        an initialized openai client. Regardless whether the operation insert data into starpoint is
        successful, the response from the openai client is returned.

        Args:
            model: Embedding model to be used for creating the embeddings. For an up to date list of what
                models are available see [OpenAI's guide on embeddings](https://platform.openai.com/docs/guides/embeddings/what-are-embeddings)
            input_data: Data to be embedded.
            document_metadatas: Optional metadatas to tie to the embeddings generated using the input data.
            collection_id: The collection's id where the documents will be updated.
                This or the `collection_name` needs to be provided.
            collection_name: The collection's name where the documents will be updated.
                This or the `collection_id` needs to be provided.
            openai_user: Optional user string used by the embedding endpoint from OpenAI.

        Returns:
            dict: Responses from starpoint and openai.
        """
        _utils._check_collection_identifier_collision(collection_id, collection_name)

        embedding_response = self.openai.Embedding.create(
            model=model, input=input_data, user=openai_user
        )

        embedding_data = embedding_response.get("data")
        if embedding_data is None:
            LOGGER.warning(NO_EMBEDDING_DATA_FOUND)
            return {
                "openai_response": embedding_response,
                "starpoint_response": None,
            }

        if document_metadatas is None:
            LOGGER.info(
                "No custom document_metadatas provided. Using input_data for the document_metadatas"
            )
            if isinstance(input_data, str):
                document_metadatas = [{"input": input_data}]
            else:
                document_metadatas = [{"input": data} for data in input_data]

        # Return the embedding response no matter what issues/bugs we might run into in the sdk
        try:
            sorted_embedding_data = sorted(embedding_data, key=lambda x: x["index"])
            embeddings = map(lambda x: x.get("embeddings"), sorted_embedding_data)
            starpoint_response = self.starpoint.column_insert(
                embeddings=embeddings,
                document_metadatas=document_metadatas,
                collection_id=collection_id,
                collection_name=collection_name,
            )
        except Exception as e:
            LOGGER.error(
                "An exception has occurred while trying to load embeddings into the db. "
                f"This is the error:\n{e}"
            )
            starpoint_response = {"error": str(e)}

        return {
            "openai_response": embedding_response,
            "starpoint_response": starpoint_response,
        }

    def default_build_and_insert_embeddings(
        self,
        input_data: Union[str, Iterable[Any]],
        collection_id: Optional[str] = None,
        collection_name: Optional[str] = None,
    ) -> Dict[Any, Any]:
        """Builds and inserts embeddings into starpoint by requesting embedding creation from
        an initialized openai client using the model `text-embedding-ada-002`. If you wish to use other models use the
        `build_and_insert_embeddings` method instead. Regardless whether the operation into starpoint is successful,
        the response from the openai client is returned.

        Args:
            model: Embedding model to be used for creating the embeddings. For an up to date list of what
                models are available see [OpenAI's guide on embeddings](https://platform.openai.com/docs/guides/embeddings/what-are-embeddings)
            input_data: Data to be embedded.
            document_metadatas: Optional metadatas to tie to the embeddings generated using the input data.
            collection_id: The collection's id where the documents will be updated.
                This or the `collection_name` needs to be provided.
            collection_name: The collection's name where the documents will be updated.
                This or the `collection_id` needs to be provided.
            openai_user: Optional user string used by the embedding endpoint from OpenAI.

        Returns:
            dict: Responses from starpoint and openai.
        """
        return self.build_and_insert_embeddings(
            model=DEFAULT_OPENAI_MODEL,
            input_data=input_data,
            collection_id=collection_id,
            collection_name=collection_name,
        )
