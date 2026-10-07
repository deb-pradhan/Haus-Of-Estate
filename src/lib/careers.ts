// Shared option sets for careers / application forms.

export const HR_INBOX = "careers@hausofestate.com";

export const YEARS_OF_EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1–3 years",
  "3–5 years",
  "5–10 years",
  "10+ years",
] as const;

export type YearsOfExperience = (typeof YEARS_OF_EXPERIENCE_OPTIONS)[number];

// Areas / fields a speculative applicant can have experience in.
export const EXPERIENCE_AREA_OPTIONS = [
  "Accounts",
  "HR",
  "Email Marketing",
  "Affiliate Marketing",
  "Social Media Marketing",
  "Real Estate Sales",
  "Real Estate Rentals",
  "Off-Plan Sales Agent",
] as const;

export type ExperienceArea = (typeof EXPERIENCE_AREA_OPTIONS)[number];

// Known arrangements only. No duration or working hours have been supplied.
export const OPPORTUNITY_TYPE_OPTIONS = [
  "Internship",
  "Self Employed",
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPE_OPTIONS)[number];

// CV upload constraints.
export const CV_MAX_BYTES = 4_000_000; // 4 MB; leaves room for multipart fields on Vercel.
export const APPLICATION_MAX_BYTES = 4_400_000; // Below Vercel's 4.5 MB request limit.
export const CV_SIZE_ERROR = "Your CV must be 4MB or smaller. Remove the file and paste a CV sharing link below, or email us directly.";
export const CV_ACCEPT = ".pdf,.doc,.docx";
export const CV_ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Used on both sides of the form. Links are sent to HR, never fetched by the server.
export function normalizeApplicationUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > 2000 || /\s/.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function validateCvFile(file?: Pick<File, 'name' | 'size' | 'type'>): string | undefined {
  if (!file || file.size === 0) return "Attach your CV or paste a CV sharing link below.";
  if (file.size > CV_MAX_BYTES) return CV_SIZE_ERROR;
  if (!/\.(pdf|docx?)$/i.test(file.name) || (file.type && !CV_ALLOWED_MIME.includes(file.type))) {
    return "CV must be a PDF, DOC or DOCX file.";
  }
}
