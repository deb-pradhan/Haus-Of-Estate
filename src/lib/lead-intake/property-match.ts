import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { LeadValidationError } from "./errors";
import { normalizePagePath } from "./normalize";

export const propertyMatchWithdrawalSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    wording: z.string().trim().min(1).max(2_000),
    privacyNoticeVersion: z.string().trim().min(1).max(80),
    formVersion: z.string().trim().min(1).max(80).default("unsubscribe.v1"),
    pageContext: z.string().trim().min(1).max(500),
    source: z.string().trim().max(100).optional(),
    campaign: z.string().trim().max(150).optional(),
  })
  .strict();

export type PropertyMatchWithdrawalInput = z.input<
  typeof propertyMatchWithdrawalSchema
>;

export interface PropertyMatchWithdrawalRecord {
  subscriptionId: string;
  eventId: string;
  withdrawnAt: Date;
}

export interface PropertyMatchConsentStore {
  recordWithdrawal(input: {
    email: string;
    wording: string;
    privacyNoticeVersion: string;
    formVersion: string;
    pageContext: string;
    source?: string;
    campaign?: string;
    withdrawnAt: Date;
  }): Promise<PropertyMatchWithdrawalRecord>;
}

type PropertyMatchPrismaClient = Pick<PrismaClient, "$transaction">;

export function createPrismaPropertyMatchConsentStore(
  client: PropertyMatchPrismaClient = db,
): PropertyMatchConsentStore {
  return {
    async recordWithdrawal(input) {
      return client.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(hashtext(${`property-match:${input.email}`}))
          `;
          const existing =
            await transaction.propertyMatchSubscription.findUnique({
              where: { email: input.email },
            });
          const latestStateAt = existing
            ? Math.max(
                existing.consentedAt?.getTime() ?? 0,
                existing.withdrawnAt?.getTime() ?? 0,
              )
            : 0;
          const subscription = !existing
            ? await transaction.propertyMatchSubscription.create({
                data: {
                  email: input.email,
                  status: "WITHDRAWN",
                  withdrawnAt: input.withdrawnAt,
                },
              })
            : latestStateAt <= input.withdrawnAt.getTime()
              ? await transaction.propertyMatchSubscription.update({
                  where: { id: existing.id },
                  data: {
                    status: "WITHDRAWN",
                    withdrawnAt: input.withdrawnAt,
                  },
                })
              : existing;
          const event = await transaction.propertyMatchConsentEvent.create({
            data: {
              subscriptionId: subscription.id,
              type: "WITHDRAWAL",
              wording: input.wording,
              privacyNoticeVersion: input.privacyNoticeVersion,
              formVersion: input.formVersion,
              pageContext: input.pageContext,
              source: input.source ?? null,
              campaign: input.campaign ?? null,
              createdAt: input.withdrawnAt,
            },
          });
          return {
            subscriptionId: subscription.id,
            eventId: event.id,
            withdrawnAt: input.withdrawnAt,
          };
        },
        { isolationLevel: "Serializable" },
      );
    },
  };
}

const prismaPropertyMatchConsentStore =
  createPrismaPropertyMatchConsentStore();

export async function recordPropertyMatchWithdrawal(
  rawInput: PropertyMatchWithdrawalInput,
  store: PropertyMatchConsentStore = prismaPropertyMatchConsentStore,
  now: () => Date = () => new Date(),
): Promise<PropertyMatchWithdrawalRecord> {
  const parsed = propertyMatchWithdrawalSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new LeadValidationError("Invalid property match withdrawal");
  }
  const input = parsed.data;
  return store.recordWithdrawal({
    email: input.email,
    wording: input.wording,
    privacyNoticeVersion: input.privacyNoticeVersion,
    formVersion: input.formVersion,
    pageContext: normalizePagePath(input.pageContext),
    source: input.source || undefined,
    campaign: input.campaign || undefined,
    withdrawnAt: now(),
  });
}
