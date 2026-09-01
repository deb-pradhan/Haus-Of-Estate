import type { UIMessage } from "ai";
import { z } from "zod";
import {
  ALL_UNIT_TYPES,
  AVAILABILITIES,
  CATEGORIES,
  INTENTS,
} from "@/lib/property-taxonomy";

export const MAX_ASSISTANT_MESSAGES = 12;
export const MAX_ASSISTANT_REQUEST_CHARACTERS = 64_000;
export const MAX_ASSISTANT_PROPERTY_RESULTS = 3;
export const MAX_ASSISTANT_KNOWLEDGE_RESULTS = 3;

const categoryValues = [...CATEGORIES] as [string, ...string[]];
const availabilityValues = [...AVAILABILITIES] as [string, ...string[]];
const intentValues = [...INTENTS] as [string, ...string[]];
const propertyTypeValues = [...ALL_UNIT_TYPES] as [string, ...string[]];

const messageIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

const assistantClientMessageSchema = z.strictObject({
  id: messageIdSchema,
  role: z.enum(["user", "assistant"]),
  parts: z.array(z.unknown()).min(1).max(32),
});

export const assistantRequestSchema = z
  .strictObject({
    messages: z
      .array(assistantClientMessageSchema)
      .min(1)
      .max(MAX_ASSISTANT_MESSAGES),
  })
  .superRefine((request, context) => {
    let serializedLength = Number.POSITIVE_INFINITY;
    try {
      serializedLength = JSON.stringify(request).length;
    } catch {
      // Parsed HTTP JSON is acyclic. Keep a fail-closed guard for direct callers.
    }
    if (serializedLength > MAX_ASSISTANT_REQUEST_CHARACTERS) {
      context.addIssue({
        code: "custom",
        message: "The conversation is too large.",
        path: ["messages"],
      });
    }

    const lastMessage = request.messages.at(-1);
    if (lastMessage?.role !== "user") {
      context.addIssue({
        code: "custom",
        message: "The final message must be from the user.",
        path: ["messages"],
      });
      return;
    }

    const hasQuestion = lastMessage.parts.some((part) => {
      if (typeof part !== "object" || part === null) return false;
      return (
        Reflect.get(part, "type") === "text" &&
        typeof Reflect.get(part, "text") === "string" &&
        (Reflect.get(part, "text") as string).trim().length > 0
      );
    });
    if (!hasQuestion) {
      context.addIssue({
        code: "custom",
        message: "Ask a question to continue.",
        path: ["messages", request.messages.length - 1, "parts"],
      });
    }
  });

export const assistantPropertySearchInputSchema = z
  .strictObject({
    query: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .optional()
      .describe("Optional property keywords, development, or community name."),
    category: z
      .enum(categoryValues)
      .optional()
      .describe("Haus property category."),
    availability: z
      .enum(availabilityValues)
      .optional()
      .describe("Ready or off-plan availability."),
    intent: z
      .enum(intentValues)
      .optional()
      .describe("Sale means buying; rent means renting."),
    propertyType: z
      .enum(propertyTypeValues)
      .optional()
      .describe("Exact Haus property type when the user names one."),
    location: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional()
      .describe("Community, development, city, or country."),
    minBedrooms: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional()
      .describe("Minimum bedrooms. Use zero for studios."),
  })
  .superRefine((input, context) => {
    if (input.availability === "off-plan" && input.intent === "rent") {
      context.addIssue({
        code: "custom",
        message: "Off-plan searches are purchase searches, not rental searches.",
        path: ["intent"],
      });
    }
  });

export const assistantPropertyLookupInputSchema = z.strictObject({
  sanityDocumentId: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^(?!drafts\.)(?!versions\.)[A-Za-z0-9._-]+$/)
    .describe("Immutable Sanity ID returned by a property search."),
});

export const assistantKnowledgeSearchInputSchema = z.strictObject({
  query: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .describe("The market or process question to search approved Haus guidance for."),
  kind: z
    .enum(["article", "faq"])
    .optional()
    .describe("Limit the search to an article or FAQ when useful."),
});

const canonicalPropertyPathSchema = z
  .string()
  .regex(/^\/properties\/[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/);
const canonicalKnowledgePathSchema = z.string().refine(
  (path) =>
    path === "/faq" ||
    /^\/blog\/[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/.test(path),
  "Invalid canonical content path.",
);
const httpsUrlSchema = z.string().max(2_048).url().startsWith("https://");
const isoDateSchema = z.string().datetime({ offset: true });

export const assistantPropertyCardSchema = z.strictObject({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(140),
  slug: z.string().min(1).max(96),
  path: canonicalPropertyPathSchema,
  summary: z.string().max(280).optional(),
  community: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  category: z.enum(categoryValues).optional(),
  availability: z.array(z.enum(availabilityValues)).max(2).optional(),
  listingType: z.array(z.enum(intentValues)).max(2).optional(),
  unitType: z.enum(propertyTypeValues).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  sizeDisplay: z.string().max(120).optional(),
  priceDisplay: z.string().max(120).optional(),
  rentPriceDisplay: z.string().max(120).optional(),
  publishedAt: isoDateSchema.optional(),
  featuredImageUrl: httpsUrlSchema.optional(),
});

export const assistantPropertyDetailSchema = assistantPropertyCardSchema.extend({
  developer: z.string().max(120).optional(),
  masterDevelopment: z.string().max(120).optional(),
  completionStatus: z.string().max(48).optional(),
  paymentPlan: z.string().max(120).optional(),
  keyFeatures: z.array(z.string().min(1).max(160)).max(8),
  amenities: z.array(z.string().min(1).max(160)).max(8),
});

export const assistantRecognizedFiltersSchema = z.strictObject({
  category: z.enum(categoryValues).optional(),
  availability: z.enum(availabilityValues).optional(),
  intent: z.enum(intentValues).optional(),
  propertyType: z.enum(propertyTypeValues).optional(),
  location: z.string().max(100).optional(),
  minBedrooms: z.number().int().min(0).max(20).optional(),
});

export const assistantPropertySearchResultSchema = z.strictObject({
  properties: z
    .array(assistantPropertyCardSchema)
    .max(MAX_ASSISTANT_PROPERTY_RESULTS),
  recognizedFilters: assistantRecognizedFiltersSchema,
  viewAllPath: z.string().min(1).max(500).startsWith("/properties"),
});

export const assistantPropertyLookupResultSchema = z.strictObject({
  property: assistantPropertyDetailSchema.nullable(),
});

export const assistantKnowledgeResultSchema = z.strictObject({
  id: z.string().min(1).max(128),
  kind: z.enum(["article", "faq"]),
  title: z.string().min(1).max(240),
  slug: z.string().min(1).max(96),
  path: canonicalKnowledgePathSchema,
  summary: z.string().min(1).max(1_200),
  sourceLabel: z.string().min(1).max(120),
  sourceUrl: httpsUrlSchema,
  asOf: isoDateSchema,
  expiresAt: isoDateSchema,
});

export const assistantKnowledgeSearchResultSchema = z.strictObject({
  results: z
    .array(assistantKnowledgeResultSchema)
    .max(MAX_ASSISTANT_KNOWLEDGE_RESULTS),
});

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantPropertySearchInput = z.infer<
  typeof assistantPropertySearchInputSchema
>;
export type AssistantPropertyLookupInput = z.infer<
  typeof assistantPropertyLookupInputSchema
>;
export type AssistantKnowledgeSearchInput = z.infer<
  typeof assistantKnowledgeSearchInputSchema
>;
export type AssistantPropertyCard = z.infer<typeof assistantPropertyCardSchema>;
export type AssistantPropertyDetail = z.infer<
  typeof assistantPropertyDetailSchema
>;
export type AssistantPropertySearchResult = z.infer<
  typeof assistantPropertySearchResultSchema
>;
export type AssistantPropertyLookupResult = z.infer<
  typeof assistantPropertyLookupResultSchema
>;
export type AssistantKnowledgeResult = z.infer<
  typeof assistantKnowledgeResultSchema
>;
export type AssistantKnowledgeSearchResult = z.infer<
  typeof assistantKnowledgeSearchResultSchema
>;

export type PropertyAssistantUITools = {
  searchPublishedProperties: {
    input: AssistantPropertySearchInput;
    output: AssistantPropertySearchResult;
  };
  getPublishedProperty: {
    input: AssistantPropertyLookupInput;
    output: AssistantPropertyLookupResult;
  };
  searchApprovedKnowledge: {
    input: AssistantKnowledgeSearchInput;
    output: AssistantKnowledgeSearchResult;
  };
};

export type PropertyAssistantUIMessage = UIMessage<
  unknown,
  never,
  PropertyAssistantUITools
>;
