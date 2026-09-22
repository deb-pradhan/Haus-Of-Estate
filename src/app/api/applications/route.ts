import { NextResponse } from "next/server";
import { CAREERS_CLOSED_HEADERS } from "@/lib/careers-availability";
import { getCareersInbox, isCareersIntakeEnabled } from "@/lib/careers-settings";
import {
  sendApplicationToTeam,
  sendApplicationConfirmationToApplicant,
  type ApplicationPayload,
  type CvAttachment,
} from "@/lib/email/resend";
import {
  APPLICATION_MAX_BYTES,
  CV_SIZE_ERROR,
  normalizeApplicationUrl,
  validateCvFile,
  EXPERIENCE_AREA_OPTIONS,
  OPPORTUNITY_TYPE_OPTIONS,
  YEARS_OF_EXPERIENCE_OPTIONS,
} from "@/lib/careers";
import { getCareerRole } from "@/sanity/careers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function POST(request: Request) {
  // Reject old/cached application forms before reading personal data or sending mail.
  if (!isCareersIntakeEnabled()) {
    return NextResponse.json(
      { error: "Online applications are not open yet." },
      { status: 404, headers: CAREERS_CLOSED_HEADERS },
    );
  }

  const tooLarge = () => NextResponse.json({ error: CV_SIZE_ERROR }, { status: 413 });
  if (Number(request.headers.get("content-length")) > APPLICATION_MAX_BYTES) return tooLarge();
  let form: FormData;
  try {
    // Bound chunked requests too, before parsing files into memory.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > APPLICATION_MAX_BYTES) {
        await reader.cancel();
        return tooLarge();
      }
      chunks.push(value);
    }
    form = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    }).formData();
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
  const fullName = str("fullName");
  const email = str("email");
  const phone = str("phone");
  const location = str("location");
  const yearsOfExperience = str("yearsOfExperience");
  const opportunityType = str("opportunityType");
  const linkedinUrl = normalizeApplicationUrl(str("linkedinUrl"));
  const portfolioUrl = normalizeApplicationUrl(str("portfolioUrl"));
  const cvUrl = normalizeApplicationUrl(str("cvUrl"));
  const coverNote = str("coverNote");
  const consent = form.get("consent") === "true" || form.get("consent") === "on";
  const experienceAreas = form
    .getAll("experienceAreas")
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());

  const errors: Record<string, string> = {};
  for (const [name, value] of form.entries()) {
    if (name !== "cv" && value instanceof File && value.size > 0) {
      errors.portfolioUrl = "Portfolio files cannot be uploaded here. Paste a portfolio sharing link instead.";
    }
  }

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

  if (linkedinUrl === null) {
    errors.linkedinUrl = "Enter a complete LinkedIn link starting with https://";
  }
  if (portfolioUrl === null) {
    errors.portfolioUrl = "Enter a complete portfolio sharing link starting with https://";
  }
  if (cvUrl === null) errors.cvUrl = "Enter a complete CV sharing link starting with https://";
  if (coverNote.length > 4000) {
    errors.coverNote = "Cover note must be 4000 characters or fewer";
  }
  if (!consent) {
    errors.consent = "You need to consent to our processing of your data";
  }

  // A CV file or link is required. Portfolio links are separate and optional.
  const cvFile = form.get("cv");
  let cv: CvAttachment | undefined;
  const file = cvFile instanceof File && cvFile.size > 0 ? cvFile : undefined;
  const cvError = file ? validateCvFile(file) : (!cvUrl ? validateCvFile() : undefined);
  if (cvError) errors.cv = cvError;
  if (file && !cvError) {
    const buf = Buffer.from(await file.arrayBuffer());
    cv = {
      filename: file.name || "cv.pdf",
      content: buf.toString("base64"),
    };
  }

  let role;
  try {
    role = await getCareerRole(roleSlug);
  } catch {
    return NextResponse.json({ error: `We couldn't check current opportunities. Please try again shortly or email ${getCareersInbox()} directly.` }, { status: 503 });
  }
  if (!role) errors.roleSlug = "This role is no longer accepting applications. Choose a current opportunity on our careers page.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", errors },
      { status: 400 },
    );
  }

  const payload: ApplicationPayload = {
    roleSlug,
    roleTitle: role!.title,
    fullName,
    email,
    phone,
    location: location || undefined,
    yearsOfExperience,
    experienceAreas: experienceAreas.length ? experienceAreas : undefined,
    opportunityType: opportunityType || undefined,
    linkedinUrl: linkedinUrl || undefined,
    portfolioUrl: portfolioUrl || undefined,
    cvUrl: cvUrl || undefined,
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
          `We couldn't deliver your application. Please email ${getCareersInbox()} directly.`,
      },
      { status: 502 },
    );
  }

  let confirmationSent = false;
  try {
    await sendApplicationConfirmationToApplicant(payload);
    confirmationSent = true;
  } catch (e) {
    console.error("[applications] confirmation email failed:", e);
  }

  return NextResponse.json({ ok: true, confirmationSent });
}
