import { randomUUID } from "node:crypto";
import {
  LeadConflictError,
  LeadInfrastructureError,
  LeadRateLimitError,
  LeadValidationError,
} from "./errors";
import {
  evaluateExistingSubmission,
  prismaLeadIntakeStore,
  type LeadIntakeStore,
  type LeadScore,
  type StoredLeadSubmission,
} from "./persistence";
import { hashNormalizedLead, type NormalizedLeadIntake } from "./normalize";
import { LEAD_FORM_VERSION } from "./contract";
import {
  resolvePublishedProject,
  type PublishedProjectContext,
} from "./project";

export interface LeadIntakeServiceDependencies {
  store: LeadIntakeStore;
  resolveProject(
    slug: string | undefined,
  ): Promise<PublishedProjectContext | undefined>;
  now(): Date;
  randomId(): string;
}

const defaultDependencies: LeadIntakeServiceDependencies = {
  store: prismaLeadIntakeStore,
  resolveProject: resolvePublishedProject,
  now: () => new Date(),
  randomId: randomUUID,
};

export function scoreLead(input: NormalizedLeadIntake): LeadScore {
  let score = 10;
  if (input.legacy.intent) {
    if (input.legacy.intent === "buyer") score = 30;
    else if (input.legacy.intent === "seller") score = 25;
    if (input.legacy.useType === "investment") score += 15;
  } else if (input.interest === "buy" || input.interest === "rent") {
    score = 30;
  } else if (input.interest === "sell_let") {
    score = 25;
  } else if (input.interest === "invest") {
    score = 45;
  }

  if (input.legacy.urgency === "distress") score += 25;
  else if (input.legacy.urgency === "urgent") score += 15;

  const tier = score >= 60 ? "hot" : score >= 35 ? "warm" : "nurture";
  let routing = "general";
  const countryOrLegacyMarket = input.preferences.market?.toLowerCase();
  const isUnitedArabEmirates =
    countryOrLegacyMarket === "dubai" ||
    countryOrLegacyMarket === "uae" ||
    countryOrLegacyMarket === "united arab emirates";
  if (
    isUnitedArabEmirates &&
    (input.legacy.area?.toLowerCase() === "palm" ||
      input.legacy.buyOrRent === "buy" ||
      (!input.legacy.intent && input.interest === "buy"))
  ) {
    routing = "luxury";
  } else if (
    input.legacy.intent === "invest" ||
    (!input.legacy.intent && input.interest === "invest")
  ) {
    routing = "investment";
  } else if (
    input.legacy.buyOrRent === "rent" ||
    input.legacy.sellOrRent === "rent" ||
    (!input.legacy.intent && input.interest === "rent")
  ) {
    routing = "leasing";
  }

  return { score, tier, routing };
}

function prismaErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error))
    return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

async function resolveConcurrentSubmission(
  input: NormalizedLeadIntake,
  payloadHash: string,
  store: LeadIntakeStore,
): Promise<StoredLeadSubmission> {
  const existing = await store.findSubmission(input.submissionId);
  const replay = evaluateExistingSubmission(
    existing,
    input.submissionId,
    payloadHash,
  );
  if (!replay) throw new LeadInfrastructureError();
  return replay;
}

export async function submitLeadIntake(
  input: NormalizedLeadIntake,
  ipHash: string,
  dependencies: LeadIntakeServiceDependencies = defaultDependencies,
): Promise<StoredLeadSubmission> {
  const payloadHash = hashNormalizedLead(input);
  const existing = await dependencies.store.findSubmission(input.submissionId);
  const replay = evaluateExistingSubmission(
    existing,
    input.submissionId,
    payloadHash,
  );
  if (replay) return replay;

  if (!input.legacy.intent && input.formVersion !== LEAD_FORM_VERSION) {
    throw new LeadValidationError("This form version has expired", {
      formVersion: ["Refresh the page and submit the current form."],
    });
  }

  const project = await dependencies.resolveProject(input.project?.slug);
  const submittedAt = dependencies.now();
  const submission = {
    input,
    project,
    payloadHash,
    ipHash,
    leadId: dependencies.randomId(),
    outboxId: dependencies.randomId(),
    submittedAt,
    scoring: scoreLead(input),
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await dependencies.store.persistSubmission(submission);
    } catch (error) {
      if (
        error instanceof LeadConflictError ||
        error instanceof LeadRateLimitError ||
        error instanceof LeadValidationError ||
        error instanceof LeadInfrastructureError
      ) {
        throw error;
      }

      const code = prismaErrorCode(error);
      if (code === "P2002") {
        return resolveConcurrentSubmission(
          input,
          payloadHash,
          dependencies.store,
        );
      }
      if (code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }

  throw new LeadInfrastructureError();
}
