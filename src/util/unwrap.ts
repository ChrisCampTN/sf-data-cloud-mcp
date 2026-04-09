/**
 * Unwraps Data Cloud API responses into a consistent shape.
 * Handles: plural key, singular key, collection pattern, bare arrays.
 */

export interface UnwrappedResponse {
  items: Record<string, unknown>[];
  totalSize?: number;
  nextPageUrl?: string;
  nextPageToken?: string;
  /** The page size reported by the API (e.g. segments returns batchSize: 20). */
  responseBatchSize?: number;
}

export function unwrapResponse(
  data: unknown,
  expectedKey: string
): UnwrappedResponse {
  // Bare array
  if (Array.isArray(data)) {
    return { items: data };
  }

  if (typeof data !== "object" || data === null) {
    return { items: [] };
  }

  const obj = data as Record<string, unknown>;

  // Collection pattern: { collection: { items: [...], total, nextPageToken } }
  if (obj.collection && typeof obj.collection === "object") {
    const coll = obj.collection as Record<string, unknown>;
    const items = Array.isArray(coll.items) ? coll.items : [];
    return {
      items: items as Record<string, unknown>[],
      totalSize: typeof coll.total === "number" ? coll.total : undefined,
      nextPageToken: typeof coll.nextPageToken === "string" ? coll.nextPageToken : undefined
    };
  }

  // Standard key: try exact match, then singular (drop trailing 's')
  let items: unknown[] | undefined;

  if (Array.isArray(obj[expectedKey])) {
    items = obj[expectedKey] as unknown[];
  } else {
    // Try singular form: dataModelObjects -> dataModelObject
    const singular = expectedKey.replace(/s$/, "");
    if (Array.isArray(obj[singular])) {
      items = obj[singular] as unknown[];
    }
  }

  if (!items) {
    // Last resort: find first array-valued key
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) {
        items = val;
        break;
      }
    }
  }

  return {
    items: (items ?? []) as Record<string, unknown>[],
    totalSize: typeof obj.totalSize === "number" ? obj.totalSize : undefined,
    nextPageUrl: typeof obj.nextPageUrl === "string" ? obj.nextPageUrl : undefined,
    responseBatchSize: typeof obj.batchSize === "number" && obj.batchSize > 0
      ? obj.batchSize
      : undefined
  };
}
