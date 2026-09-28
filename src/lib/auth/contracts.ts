import { z } from "zod";

const MAX_BCRYPT_BYTES = 72;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

const normalizedEmailSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeEmail(value) : value),
  z.string().email("Enter a valid email address.").max(254),
);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be no more than 128 characters.")
  .refine(
    (value) => utf8ByteLength(value) <= MAX_BCRYPT_BYTES,
    "Password is too long for secure password storage.",
  );

const optionalPhoneSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const normalized = value.trim().replace(/\s+/g, " ");
    return normalized.length === 0 ? undefined : normalized;
  },
  z.string().max(32, "Phone number is too long.").optional(),
);

const optionalReturnToSchema = z.string().max(2_048).optional();
const optionalTurnstileTokenSchema = z
  .string()
  .trim()
  .min(1, "Complete the security check.")
  .max(2_048, "The security check response is invalid.")
  .optional();

export const credentialsSchema = z.object({
  email: normalizedEmailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z
    .string()
    .transform(normalizeWhitespace)
    .pipe(z.string().min(1, "Enter your name.").max(100, "Name is too long.")),
  email: normalizedEmailSchema,
  password: passwordSchema,
  phone: optionalPhoneSchema,
  returnTo: optionalReturnToSchema,
  turnstileToken: optionalTurnstileTokenSchema,
});

export const emailActionSchema = z.object({
  email: normalizedEmailSchema,
  returnTo: optionalReturnToSchema,
  turnstileToken: optionalTurnstileTokenSchema,
});

const actionTokenSchema = z
  .string()
  .trim()
  .min(32, "The action token is invalid.")
  .max(256, "The action token is invalid.")
  .regex(/^[A-Za-z0-9_-]+$/, "The action token is invalid.");

export const verifyEmailSchema = z.object({
  token: actionTokenSchema,
});

export const resetPasswordSchema = z.object({
  token: actionTokenSchema,
  password: passwordSchema,
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EmailActionInput = z.infer<typeof emailActionSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
