export type SavedContentType = "PROPERTY" | "ARTICLE";

export interface SavedContentKey {
  contentType: SavedContentType;
  sanityDocumentId: string;
}

const SANITY_DOCUMENT_ID = /^(?!drafts\.)(?!versions\.)[A-Za-z0-9._-]+$/;

export function savedContentKey(entry: SavedContentKey) {
  return `${entry.contentType}:${entry.sanityDocumentId}`;
}

export function isValidSanityDocumentId(value: string) {
  return value.length > 0 && value.length <= 128 && SANITY_DOCUMENT_ID.test(value);
}

export function shouldRetainAnonymousSave(status?: number) {
  return (
    status === undefined ||
    status === 401 ||
    status === 403 ||
    status === 408 ||
    status === 429 ||
    status >= 500
  );
}

export function mergeSavedContentKeys(
  remote: SavedContentKey[],
  retryableLocal: SavedContentKey[],
) {
  const combined = new Map<string, SavedContentKey>();
  for (const entry of [...remote, ...retryableLocal]) {
    combined.set(savedContentKey(entry), entry);
  }
  return [...combined.values()];
}
