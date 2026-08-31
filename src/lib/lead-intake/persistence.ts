import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { buildLeadDeliveryPayload } from "@/lib/lead-delivery";
import {
  PROPERTY_MATCH_CONSENT_WORDING,
  newsletterConsentWordingFor,
} from "./contract";
import {
  LeadConflictError,
  LeadRateLimitError,
} from "./errors";
import type { NormalizedLeadIntake } from "./normalize";
import type { PublishedProjectContext } from "./project";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const THROTTLE_RETENTION_MS = 24 * 60 * 60 * 1_000;

export interface ExistingLeadSubmission {
  id: string;
  submissionId: string | null;
  payloadHash: string | null;
  score: number;
  tier: string | null;
  deliveryOutbox?: { id: string } | null;
}

export interface LeadScore {
  score: number;
  tier: string;
  routing: string;
}

export interface PersistLeadSubmission {
  input: NormalizedLeadIntake;
  project?: PublishedProjectContext;
  payloadHash: string;
  ipHash: string;
  leadId: string;
  outboxId: string;
  submittedAt: Date;
  scoring: LeadScore;
}

export interface StoredLeadSubmission {
  created: boolean;
  leadId: string;
  submissionId: string;
  score: number;
  tier: string;
  outboxId?: string;
}

export interface LeadIntakeStore {
  findSubmission(submissionId: string): Promise<ExistingLeadSubmission | null>;
  persistSubmission(
    submission: PersistLeadSubmission,
  ): Promise<StoredLeadSubmission>;
}

type LeadIntakePrismaClient = Pick<PrismaClient, "lead" | "$transaction">;

function replayOrConflict(
  existing: ExistingLeadSubmission,
  submissionId: string,
  payloadHash: string,
): StoredLeadSubmission {
  if (existing.payloadHash !== payloadHash) throw new LeadConflictError();
  return {
    created: false,
    leadId: existing.id,
    submissionId,
    score: existing.score,
    tier: existing.tier ?? "nurture",
    outboxId: existing.deliveryOutbox?.id,
  };
}

async function acquireThrottleSlot(
  transaction: Prisma.TransactionClient,
  ipHash: string,
  now: Date,
): Promise<void> {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${ipHash}))
  `;

  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const recentCount = await transaction.leadSubmissionThrottle.count({
    where: { ipHash, createdAt: { gte: windowStart } },
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    const earliest = await transaction.leadSubmissionThrottle.findFirst({
      where: { ipHash, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const retryAt =
      (earliest?.createdAt.getTime() ?? now.getTime()) + RATE_LIMIT_WINDOW_MS;
    throw new LeadRateLimitError(
      Math.max(1, Math.ceil((retryAt - now.getTime()) / 1_000)),
    );
  }

  await transaction.leadSubmissionThrottle.create({
    data: { ipHash, createdAt: now },
  });
  await transaction.leadSubmissionThrottle.deleteMany({
    where: {
      createdAt: { lt: new Date(now.getTime() - THROTTLE_RETENTION_MS) },
    },
  });
}

export function createPrismaLeadIntakeStore(
  client: LeadIntakePrismaClient = db,
): LeadIntakeStore {
  return {
    async findSubmission(submissionId) {
      return client.lead.findUnique({
        where: { submissionId },
        select: {
          id: true,
          submissionId: true,
          payloadHash: true,
          score: true,
          tier: true,
          deliveryOutbox: { select: { id: true } },
        },
      });
    },

    async persistSubmission(submission) {
      return client.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(hashtext(${submission.input.submissionId}))
          `;

          const existing = await transaction.lead.findUnique({
            where: { submissionId: submission.input.submissionId },
            select: {
              id: true,
              submissionId: true,
              payloadHash: true,
              score: true,
              tier: true,
              deliveryOutbox: { select: { id: true } },
            },
          });
          if (existing) {
            return replayOrConflict(
              existing,
              submission.input.submissionId,
              submission.payloadHash,
            );
          }

          await acquireThrottleSlot(
            transaction,
            submission.ipHash,
            submission.submittedAt,
          );

          const { input, project, scoring } = submission;
          const lead = await transaction.lead.create({
            data: {
              id: submission.leadId,
              submissionId: input.submissionId,
              payloadHash: submission.payloadHash,
              email: input.contact.email,
              firstName: input.contact.firstName,
              surname: input.contact.surname ?? null,
              phone: input.contact.phone ?? null,
              intent: input.legacy.intent ?? input.interest,
              market: input.preferences.market ?? null,
              buyOrRent:
                input.legacy.buyOrRent ??
                (input.interest === "buy" || input.interest === "rent"
                  ? input.interest
                  : null),
              useType:
                input.legacy.useType ??
                (input.interest === "invest" ? "investment" : null),
              bedrooms: input.preferences.bedrooms ?? null,
              bathrooms: input.preferences.bathrooms ?? null,
              area: input.legacy.area ?? null,
              sellOrRent: input.legacy.sellOrRent ?? null,
              propertyType: input.preferences.propertyType ?? null,
              location: input.preferences.location ?? null,
              size: input.legacy.size ?? null,
              viewType: input.legacy.viewType ?? null,
              urgency: input.legacy.urgency ?? null,
              budget: input.legacy.budget ?? null,
              timeline: input.preferences.timeframe ?? null,
              message: input.contact.message ?? null,
              projectSlug: project?.slug ?? null,
              projectTitle: project?.title ?? null,
              projectCommunity: project?.community ?? null,
              score: scoring.score,
              tier: scoring.tier,
              routing: scoring.routing,
              consentGiven: input.enquiryConsentGiven,
              propertyMatchOptIn: input.propertyMatchOptIn,
              newsletterOptIn: input.newsletterOptIn,
              formVersion: input.formVersion,
              privacyNoticeVersion: input.privacyNoticeVersion,
              formSurface: input.context.surface,
              pagePath: input.context.pagePath,
              referrer: input.context.referrer ?? null,
              utmSource: input.context.utmSource ?? null,
              utmMedium: input.context.utmMedium ?? null,
              utmCampaign: input.context.utmCampaign ?? null,
              utmContent: input.context.utmContent ?? null,
              utmTerm: input.context.utmTerm ?? null,
              source: input.context.utmSource ?? input.context.surface,
              createdAt: submission.submittedAt,
            },
          });

          if (input.propertyMatchOptIn) {
            await transaction.$executeRaw`
              SELECT pg_advisory_xact_lock(hashtext(${`property-match:${input.contact.email}`}))
            `;
            const existingSubscription =
              await transaction.propertyMatchSubscription.findUnique({
                where: { email: input.contact.email },
              });
            const latestStateAt = existingSubscription
              ? Math.max(
                  existingSubscription.consentedAt?.getTime() ?? 0,
                  existingSubscription.withdrawnAt?.getTime() ?? 0,
                )
              : 0;
            const criteria: Prisma.InputJsonObject = {
              interest: input.interest,
              market: input.preferences.market ?? null,
              location: input.preferences.location ?? null,
              propertyType: input.preferences.propertyType ?? null,
              bedrooms: input.preferences.bedrooms ?? null,
              bathrooms: input.preferences.bathrooms ?? null,
              timeframe: input.preferences.timeframe ?? null,
              projectSlug: project?.slug ?? input.project?.slug ?? null,
            };
            const subscription = !existingSubscription
              ? await transaction.propertyMatchSubscription.create({
                  data: {
                    email: input.contact.email,
                    status: "ACTIVE",
                    criteria,
                    consentedAt: submission.submittedAt,
                  },
                })
              : latestStateAt < submission.submittedAt.getTime()
                ? await transaction.propertyMatchSubscription.update({
                    where: { id: existingSubscription.id },
                    data: {
                      status: "ACTIVE",
                      criteria,
                      consentedAt: submission.submittedAt,
                      withdrawnAt: null,
                    },
                  })
                : existingSubscription;
            await transaction.propertyMatchConsentEvent.create({
              data: {
                subscriptionId: subscription.id,
                leadId: lead.id,
                type: "OPT_IN",
                wording: PROPERTY_MATCH_CONSENT_WORDING,
                privacyNoticeVersion: input.privacyNoticeVersion,
                formVersion: input.formVersion,
                pageContext: input.context.pagePath,
                source: input.context.utmSource ?? input.context.surface,
                campaign: input.context.utmCampaign ?? null,
                createdAt: submission.submittedAt,
              },
            });
          }

          if (input.newsletterOptIn) {
            await transaction.$executeRaw`
              SELECT pg_advisory_xact_lock(hashtext(${`newsletter:${input.contact.email}`}))
            `;
            const existingSubscription =
              await transaction.newsletterSubscription.findUnique({
                where: { email: input.contact.email },
              });
            const latestStateAt = existingSubscription
              ? Math.max(
                  existingSubscription.consentedAt?.getTime() ?? 0,
                  existingSubscription.withdrawnAt?.getTime() ?? 0,
                )
              : 0;
            const subscription = !existingSubscription
              ? await transaction.newsletterSubscription.create({
                  data: {
                    email: input.contact.email,
                    status: "ACTIVE",
                    consentedAt: submission.submittedAt,
                  },
                })
              : latestStateAt < submission.submittedAt.getTime()
                ? await transaction.newsletterSubscription.update({
                    where: { id: existingSubscription.id },
                    data: {
                      status: "ACTIVE",
                      consentedAt: submission.submittedAt,
                      withdrawnAt: null,
                    },
                  })
                : existingSubscription;
            await transaction.newsletterConsentEvent.create({
              data: {
                subscriptionId: subscription.id,
                leadId: lead.id,
                type: "OPT_IN",
                wording: newsletterConsentWordingFor(input.formVersion),
                privacyNoticeVersion: input.privacyNoticeVersion,
                formVersion: input.formVersion,
                pageContext: input.context.pagePath,
                source: input.context.utmSource ?? input.context.surface,
                campaign: input.context.utmCampaign ?? null,
                createdAt: submission.submittedAt,
              },
            });
          }

          const deliveryPayload = buildLeadDeliveryPayload({
            eventId: submission.outboxId,
            leadId: lead.id,
            submittedAt: submission.submittedAt,
            firstName: input.contact.firstName,
            surname: input.contact.surname,
            email: input.contact.email,
            phone: input.contact.phone,
            interest: input.interest,
            market: input.preferences.market,
            location: input.preferences.location,
            propertyType: input.preferences.propertyType,
            bedrooms: input.preferences.bedrooms,
            bathrooms: input.preferences.bathrooms,
            timeframe: input.preferences.timeframe,
            project: project?.title,
            propertyMatchOptIn: input.propertyMatchOptIn,
            newsletterOptIn: input.newsletterOptIn,
            source: input.context.utmSource ?? input.context.surface,
            campaign: input.context.utmCampaign,
            landingPage: input.context.pagePath,
          });
          await transaction.leadDeliveryOutbox.create({
            data: {
              id: submission.outboxId,
              leadId: lead.id,
              payload: deliveryPayload as unknown as Prisma.InputJsonValue,
              availableAt: submission.submittedAt,
            },
          });

          return {
            created: true,
            leadId: lead.id,
            submissionId: input.submissionId,
            score: scoring.score,
            tier: scoring.tier,
            outboxId: submission.outboxId,
          };
        },
        { isolationLevel: "Serializable" },
      );
    },
  };
}

export const prismaLeadIntakeStore = createPrismaLeadIntakeStore();

export function evaluateExistingSubmission(
  existing: ExistingLeadSubmission | null,
  submissionId: string,
  payloadHash: string,
): StoredLeadSubmission | undefined {
  return existing
    ? replayOrConflict(existing, submissionId, payloadHash)
    : undefined;
}
