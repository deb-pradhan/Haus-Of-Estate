import { NextResponse } from "next/server";
import {
  sendApplicationToTeam,
  sendApplicationConfirmationToApplicant,
  type ApplicationPayload,
  type CvAttachment,
} from "@/lib/email/resend";
import {
  CV_ALLOWED_MIME,
  CV_MAX_BYTES,
  EXPERIENCE_AREA_OPTIONS,
  OPPORTUNITY_TYPE_OPTIONS,
  YEARS_OF_EXPERIENCE_OPTIONS,
} from "@/lib/careers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim() : "";
  };

  // Honeypot — silently accept and drop.
  if (str("website").length > 0) {
    return NextResponse.json({ ok: true });
  }

  const roleSlug = str("roleSlug");
  const roleTitle = str("roleTitle");
  const fullName = str("fullName");
  const email = str("email");
  const phone = str("phone");
  const location = str("location");
  const yearsOfExperience = str("yearsOfExperience");
  const opportunityType = str("opportunityType");
  const linkedinUrl = str("linkedinUrl");
  const portfolioUrl = str("portfolioUrl");
  const coverNote = str("coverNote");
  const consent = form.get("consent") === "true" || form.get("consent") === "on";
  const experienceAreas = form
    .getAll("experienceAreas")
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());

  const errors: Record<string, string> = {};

  if (!roleTitle) errors.roleTitle = "Role title is required";
  if (!roleSlug) errors.roleSlug = "Role slug is required";
  if (!fullName) errors.fullName = "Full name is required";
  if (!email) errors.email = "Email is required";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
  if (!phone) errors.phone = "Phone is required";

  if (!yearsOfExperience) {
    errors.yearsOfExperience = "Select your years of experience";
  } else if (
    !YEARS_OF_EXPERIENCE_OPTIONS.includes(
      yearsOfExperience as (typeof YEARS_OF_EXPERIENCE_OPTIONS)[number],
    )
  ) {
    errors.yearsOfExperience = "Invalid years-of-experience value";
  }

  if (
    opportunityType &&
    !OPPORTUNITY_TYPE_OPTIONS.includes(
      opportunityType as (typeof OPPORTUNITY_TYPE_OPTIONS)[number],
    )
  ) {
    errors.opportunityType = "Invalid opportunity type";
  }

  const invalidArea = experienceAreas.find(
    (a) =>
      !EXPERIENCE_AREA_OPTIONS.includes(
        a as (typeof EXPERIENCE_AREA_OPTIONS)[number],
      ),
  );
  if (invalidArea) errors.experienceAreas = "Invalid area of experience";

  if (linkedinUrl && !URL_RE.test(linkedinUrl)) {
    errors.linkedinUrl = "LinkedIn must be a full https:// URL";
  }
  if (portfolioUrl && !URL_RE.test(portfolioUrl)) {
    errors.portfolioUrl = "Portfolio must be a full https:// URL";
  }
  if (coverNote.length > 4000) {
    errors.coverNote = "Cover note must be 4000 characters or fewer";
  }
  if (!consent) {
    errors.consent = "You need to consent to our processing of your data";
  }

  // ── CV file (required) ──────────────────────────────────────────────
  const cvFile = form.get("cv");
  let cv: CvAttachment | undefined;
  if (!(cvFile instanceof File) || cvFile.size === 0) {
    errors.cv = "Please attach your CV";
  } else if (cvFile.size > CV_MAX_BYTES) {
    errors.cv = "Your CV must be 5MB or smaller";
  } else if (
    cvFile.type &&
    !CV_ALLOWED_MIME.includes(cvFile.type) &&
    !/\.(pdf|docx?|DOCX?|PDF)$/.test(cvFile.name)
  ) {
    errors.cv = "CV must be a PDF, DOC or DOCX file";
  } else {
    const buf = Buffer.from(await cvFile.arrayBuffer());
    cv = {
      filename: cvFile.name || "cv.pdf",
      content: buf.toString("base64"),
    };
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", errors },
      { status: 400 },
    );
  }

  const payload: ApplicationPayload = {
    roleSlug,
    roleTitle,
    fullName,
    email,
    phone,
    location: location || undefined,
    yearsOfExperience,
    experienceAreas: experienceAreas.length ? experienceAreas : undefined,
    opportunityType: opportunityType || undefined,
    linkedinUrl: linkedinUrl || undefined,
    portfolioUrl: portfolioUrl || undefined,
    coverNote: coverNote || undefined,
    cv,
  };

  try {
    await sendApplicationToTeam(payload);
  } catch (e) {
    console.error("[applications] sendApplicationToTeam failed:", e);
    return NextResponse.json(
      {
        error:
          "We couldn't deliver your application. Please email hr@hausofestate.com directly.",
      },
      { status: 502 },
    );
  }

  sendApplicationConfirmationToApplicant(payload).catch((e) => {
    console.error("[applications] confirmation email failed:", e);
  });

  return NextResponse.json({ ok: true });
}
