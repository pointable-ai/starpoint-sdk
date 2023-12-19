from python.starpoint.db import Client

SP_API_KEY = ""
SP_COLLECTION_ID = ""
client = Client(api_key=SP_API_KEY, reader_host="http://127.0.0.1:9000/", writer_host="http://127.0.0.1:3000/")

embeddings = [{
        "values": [8.0, 0.0, 0.0],
        "dimensionality": 3
    }]

data = {"mock": "value"}

insert_res = client.column_insert(
    collection_id=SP_COLLECTION_ID,
    embeddings=embeddings,
    document_metadatas=[data]
)

docs = client.query(collection_id=SP_COLLECTION_ID, sql="SELECT * FROM collection", query_embedding={
        "values": [1.0, 0.0, 0.0, 2.0, 0.0, 0.0, 3.0, 0.0, 0.0],
        "dimensionality": 3
})
print(docs)

id = docs["results"][0]['__id']
embeddings = [{
        "values": [2.2, 3.3, 3.3, 4.4, 5.5, 6.6],
        "dimensionality": 3
    }]
docs2 = client.column_update(
    ids=[id],
    collection_id=SP_COLLECTION_ID,
    embeddings=embeddings,
    document_metadatas=[{"mock": "value4"}]
)

docs2 = client.update(
    collection_id=SP_COLLECTION_ID,
    documents=[{"id": id, "metadata": {"mock": "value4444"}}]
)

docs3 = client.query(collection_id=SP_COLLECTION_ID, sql="SELECT * FROM collection", query_embedding={
        "values": [1.1, 1.1, 1.1],
        "dimensionality": 3
    })

print(docs3)

# clean up
client.delete(collection_id=SP_COLLECTION_ID, documents=[result["__id"] for result in docs["results"]])
