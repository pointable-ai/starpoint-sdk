import isURL from "validator/lib/isURL";

import { ByWrapper } from "./common-types";
import {
  MISSING_COLLECTION_IDENTIFIER_ERROR,
  MISSING_HOST_ERROR,
  MULTIPLE_COLLECTION_IDENTIFIER_ERROR,
  NULL_COLLECTION_ID_ERROR,
  NULL_COLLECTION_NAME_ERROR,
} from "./constants";

export const setAndValidateHost = (host: string) => {
  if (!host) {
    throw new Error(MISSING_HOST_ERROR);
  } else if (
    !isURL(host, {
      require_tld: false,
      require_protocol: false,
      require_host: false,
      require_port: false,
      require_valid_protocol: false,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
      allow_fragments: false,
      allow_query_components: true,
      disallow_auth: false,
      validate_length: false,
    })
  ) {
    throw new Error(`Provided host ${host} is not a valid URL format.`);
  }
  const trimmed_hostname = host.replace(/\/$/, ""); // Remove trailing slashes from the host URL

  return trimmed_hostname;
};

export function sanitizeCollectionIdentifiersInRequest<T>(
  request: ByWrapper<T>
) {
  if ("collection_id" in request && "collection_name" in request) {
    throw new Error(MULTIPLE_COLLECTION_IDENTIFIER_ERROR);
  }
  if (!("collection_id" in request) && !("collection_name" in request)) {
    throw new Error(MISSING_COLLECTION_IDENTIFIER_ERROR);
  }
  if (
    !("collection_id" in request) &&
    "collection_name" in request &&
    !request.collection_name
  ) {
    throw new Error(NULL_COLLECTION_NAME_ERROR);
  }
  if (
    !("collection_name" in request) &&
    "collection_id" in request &&
    !request.collection_id
  ) {
    throw new Error(NULL_COLLECTION_ID_ERROR);
  }
}
