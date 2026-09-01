import { afterEach, describe, expect, it } from "vitest";
import { isSavedContentEnabled } from "@/lib/features";
import {
  sanityDocumentIdSchema,
  savedContentMutationSchema,
} from "@/lib/saved-content/contracts";
import { hydrateSavedContent } from "@/lib/saved-content/sanity";

const previousFeatureFlag = process.env.SAVED_CONTENT_ENABLED;

afterEach(() => {
  if (previousFeatureFlag === undefined) {
    delete process.env.SAVED_CONTENT_ENABLED;
  } else {
    process.env.SAVED_CONTENT_ENABLED = previousFeatureFlag;
  }
});

describe("saved-content contracts", () => {
  it("keeps the server feature disabled unless explicitly true", () => {
    delete process.env.SAVED_CONTENT_ENABLED;
    expect(isSavedContentEnabled()).toBe(false);

    process.env.SAVED_CONTENT_ENABLED = "TRUE";
    expect(isSavedContentEnabled()).toBe(false);

    process.env.SAVED_CONTENT_ENABLED = "true";
    expect(isSavedContentEnabled()).toBe(true);
  });

  it("accepts immutable published IDs and rejects drafts and forged fields", () => {
    expect(sanityDocumentIdSchema.parse("property.a1-b2_c3")).toBe(
      "property.a1-b2_c3",
    );
    expect(sanityDocumentIdSchema.safeParse("drafts.property-1").success).toBe(
      false,
    );
    expect(
      savedContentMutationSchema.safeParse({
        contentType: "PROPERTY",
        sanityDocumentId: "property-1",
        userId: "victim-user",
      }).success,
    ).toBe(false);
  });

  it("drops deleted, archived, and content-type-mismatched Sanity documents", () => {
    const savedAt = new Date("2026-09-01T12:00:00.000Z");
    const hydrated = hydrateSavedContent(
      [
        {
          id: "saved-property",
          contentType: "PROPERTY",
          sanityDocumentId: "property-1",
          createdAt: savedAt,
        },
        {
          id: "saved-deleted",
          contentType: "ARTICLE",
          sanityDocumentId: "post-deleted",
          createdAt: savedAt,
        },
        {
          id: "saved-mismatched",
          contentType: "ARTICLE",
          sanityDocumentId: "property-1",
          createdAt: savedAt,
        },
      ],
      [
        {
          _id: "property-1",
          _type: "property",
          title: "A published home",
          slug: "a-published-home",
        },
      ],
    );

    expect(hydrated).toEqual([
      {
        id: "saved-property",
        contentType: "PROPERTY",
        sanityDocumentId: "property-1",
        savedAt: "2026-09-01T12:00:00.000Z",
        content: expect.objectContaining({
          _id: "property-1",
          _type: "property",
        }),
      },
    ]);
  });
});
