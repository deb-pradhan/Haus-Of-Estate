import { NextResponse } from "next/server";
import { CAREERS_CLOSED_HEADERS, CAREERS_PUBLIC_ENABLED } from "@/lib/careers-availability";
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
import { createRateLimiter, enforceRateLimit, isHoneypotTripped } from "@/lib/rate-limit";
import { clampString, isEmail } from "@/lib/security";

// 3 applications per hour per IP (each carries a CV of up to 5 MB).
const limiter = createRateLimiter({ id: "applications", limit: 3, windowMs: 60 * 60_000 });
// CV cap + room for the other multipart fields and boundaries.
const MAX_BODY_BYTES = CV_MAX_BYTES + 512 * 1024;

const URL_RE = /^https?:\/\/[^\s]+$/i;

export async function POST(request: Request) {
  // Reject old/cached application forms before reading personal data or sending mail.
  if (!CAREERS_PUBLIC_ENABLED) {
    return NextResponse.json(
      { error: "Applications are currently closed." },
      { status: 404, headers: CAREERS_CLOSED_HEADERS },
    );
  }

  const limited = await enforceRateLimit(request, limiter);
  if (limited) return limited;

  // Refuse oversized bodies before buffering them into memory.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Your application is too large. Your CV must be 5MB or smaller." },
      { status: 413 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  // Trimmed, control characters stripped, bounded (cover note gets its own cap).
  const str = (k: string, max = 300) => clampString(form.get(k), max);

  // Honeypot — silently accept and drop.
  if (isHoneypotTripped(str("website"))) {
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
  const linkedinUrl = str("linkedinUrl", 500);
  const portfolioUrl = str("portfolioUrl", 500);
  const coverNote = clampString(form.get("coverNote"), 4001);
  const consent = form.get("consent") === "true" || form.get("consent") === "on";
  const experienceAreas = form
    .getAll("experienceAreas")
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, 20)
    .map((v) => clampString(v, 100));

  const errors: Record<string, string> = {};

  if (!roleTitle) errors.roleTitle = "Role title is required";
  if (!roleSlug) errors.roleSlug = "Role slug is required";
  if (!fullName) errors.fullName = "Full name is required";
  if (!email) errors.email = "Email is required";
  else if (!isEmail(email)) errors.email = "Enter a valid email address";
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
    console.error("[applications] sendApplicationToTeam failed:", (e as Error)?.message);
    return NextResponse.json(
      {
        error:
          "We couldn't deliver your application. Please email hr@hausofestate.com directly.",
      },
      { status: 502 },
    );
  }

  sendApplicationConfirmationToApplicant(payload).catch((e) => {
    console.error("[applications] confirmation email failed:", (e as Error)?.message);
  });

  return NextResponse.json({ ok: true });
}
