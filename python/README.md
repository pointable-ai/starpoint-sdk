# Starpoint AI SDK

## Installation

`pip install starpoint`

## Quickstart

After you have a API key and a collection created on your starpoint account

```python
from starpoint.db import Client

client = Client(api_key="YOUR_API_KEY_HERE")

documents = [
  {
    "embedding": [0.1, 0.2, 0.3, 0.4, 0.5],
    "metadata": {
      "label1": "0",
      "label2": "1",
    }
  },
]

// Instead of collection_name you can also use collection_id="COLLECTION_ID"
client.insert(documents=documents, collection_name="COLLECTION_NAME")

```

## Contributing

Make sure you have installed dev requirements
```
pip install -r dev-requirements.txt
```

Unit tests should be passing. You can run them via
```
pytest ./tests
```
