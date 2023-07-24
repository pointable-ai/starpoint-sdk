// COLLECTION TYPES
// CREATE
export interface CreateCollectionRequest {
  name: string;
  dimensionality: number;
}

export interface CreateCollectionResponse {
  id: string;
  name: string;
  dimensionality: number;
}

// DELETE
export interface DeleteCollectionRequest {
  collection_id: string;
}

export interface DeleteCollectionResponse {
  success: boolean;
}
