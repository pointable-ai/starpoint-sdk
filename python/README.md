# Pointlab SDK

## Installation

`pip install pointlab`

## Quickstart

After you have a API key and a collection created on your pointlab account

```python
from pointlab.db import DbClient

client = DbClient(api_key="<your-api-key-here>")

documents = {
    "embeddings": [1.0, 0, 0.8],
    "metadata": {label: "0"},
}

client.insert(documents=documents, collection_name="<your-collection-name>")  # You might prefer to use collection_id here instead

```

