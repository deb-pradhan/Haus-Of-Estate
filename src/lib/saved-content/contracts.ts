import { z } from "zod";

export const savedContentTypeSchema = z.enum(["PROPERTY", "ARTICLE"]);

export const sanityDocumentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(
    /^(?!drafts\.)(?!versions\.)[A-Za-z0-9._-]+$/,
    "Select a valid published item.",
  );

export const savedContentMutationSchema = z.strictObject({
  contentType: savedContentTypeSchema,
  sanityDocumentId: sanityDocumentIdSchema,
});

export const savedContentListSchema = z.strictObject({
  contentType: savedContentTypeSchema.optional(),
});

export type SavedContentMutation = z.infer<typeof savedContentMutationSchema>;
export type SavedContentTypeValue = z.infer<typeof savedContentTypeSchema>;
