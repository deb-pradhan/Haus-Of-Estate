import { client } from "@/sanity";
import type { SavedContentTypeValue } from "./contracts";

const SAVED_DOCUMENT_FIELDS = `
  _id,
  _type,
  title,
  "slug": slug.current,
  featuredImage,
  subtitle,
  summary,
  publishedAt,
  community,
  masterDevelopment,
  city,
  country,
  category,
  availability,
  listingType,
  unitType,
  bedrooms,
  bathrooms,
  sizeDisplay,
  priceDisplay,
  rentPriceDisplay
`;

const PUBLISHED_DOCUMENT_BY_ID_QUERY = `
  *[
    _id == $id
    && _type == $documentType
    && status == "published"
    && defined(slug.current)
    && !(_id in path("drafts.**"))
  ][0] {
    ${SAVED_DOCUMENT_FIELDS}
  }
`;

const PUBLISHED_DOCUMENTS_BY_ID_QUERY = `
  *[
    _id in $ids
    && _type in ["property", "post"]
    && status == "published"
    && defined(slug.current)
    && !(_id in path("drafts.**"))
  ] {
    ${SAVED_DOCUMENT_FIELDS}
  }
`;

export type PublishedSavedDocument = {
  _id: string;
  _type: "property" | "post";
  title: string;
  slug: string;
  featuredImage?: unknown;
  subtitle?: string;
  summary?: string;
  publishedAt?: string;
  community?: string;
  masterDevelopment?: string;
  city?: string;
  country?: string;
  category?: string;
  availability?: string[];
  listingType?: string[];
  unitType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeDisplay?: string;
  priceDisplay?: string;
  rentPriceDisplay?: string;
};

type SavedRecord = {
  id: string;
  contentType: SavedContentTypeValue;
  sanityDocumentId: string;
  createdAt: Date;
};

export type HydratedSavedContent = {
  id: string;
  contentType: SavedContentTypeValue;
  sanityDocumentId: string;
  savedAt: string;
  content: PublishedSavedDocument;
};

function sanityType(contentType: SavedContentTypeValue): "property" | "post" {
  return contentType === "PROPERTY" ? "property" : "post";
}

export async function findPublishedSavedDocument(
  contentType: SavedContentTypeValue,
  sanityDocumentId: string,
): Promise<PublishedSavedDocument | null> {
  return client.fetch<PublishedSavedDocument | null>(
    PUBLISHED_DOCUMENT_BY_ID_QUERY,
    {
      id: sanityDocumentId,
      documentType: sanityType(contentType),
    },
    { perspective: "published" },
  );
}

export async function findPublishedSavedDocuments(
  sanityDocumentIds: string[],
): Promise<PublishedSavedDocument[]> {
  if (sanityDocumentIds.length === 0) return [];

  return client.fetch<PublishedSavedDocument[]>(
    PUBLISHED_DOCUMENTS_BY_ID_QUERY,
    { ids: [...new Set(sanityDocumentIds)] },
    { perspective: "published" },
  );
}

export function hydrateSavedContent(
  savedRecords: SavedRecord[],
  publishedDocuments: PublishedSavedDocument[],
): HydratedSavedContent[] {
  const documents = new Map(
    publishedDocuments.map((document) => [
      `${document._type}:${document._id}`,
      document,
    ]),
  );

  return savedRecords.flatMap((record) => {
    const document = documents.get(
      `${sanityType(record.contentType)}:${record.sanityDocumentId}`,
    );
    if (!document) return [];

    return [
      {
        id: record.id,
        contentType: record.contentType,
        sanityDocumentId: record.sanityDocumentId,
        savedAt: record.createdAt.toISOString(),
        content: document,
      },
    ];
  });
}
