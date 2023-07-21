# Starpoint AI SDK

## Installation

`npm install starpoint`

## Quickstart

After you have a API key and a collection created on your starpoint account

```typescript
import { db } from "starpoint";

const run = async () => {
  const client = db.initialize("YOUR_API_KEY_HERE");
  const result = await client.insert({
    collection_name: "COLLECTION_NAME",
    // or collection_id: "COLLECTION_ID"
    documents: [
      {
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        metadata: {
          label1: "0",
          label2: "1",
        },
      },
    ],
  });

  console.log(result.json());
  // result datashape:
  // {
  //    collection_id: string,
  //    documents: { id: string }
  // }
};

run();

```

## Generating Documentation

Documentation is generated from the source code and outputs as markdown.

`npx typedoc`

## Contributing

Make sure you have installed dev requirements
```
npm it
```

TODO: unit tests
