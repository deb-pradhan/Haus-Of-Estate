// Shared option sets for careers / application forms.

export const HR_INBOX = "hr@hausofestate.com";

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

// Opportunity types offered under the Careers tab.
export const OPPORTUNITY_TYPE_OPTIONS = [
  "Internship (3–6 months)",
  "Part-Time Job",
  "Full-Time Job",
  "Open to any",
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPE_OPTIONS)[number];

// CV upload constraints.
export const CV_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const CV_ACCEPT = ".pdf,.doc,.docx";
export const CV_ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
