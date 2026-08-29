export const LEAD_DELIVERY_SCHEMA_VERSION = "1.0" as const;
export const LEAD_DELIVERY_EVENT_TYPE = "lead.created" as const;

export const LEAD_DELIVERY_STATUSES = {
  pending: "PENDING",
  processing: "PROCESSING",
  delivered: "DELIVERED",
  deadLetter: "DEAD_LETTER",
} as const;

export type LeadDeliveryStatus =
  (typeof LEAD_DELIVERY_STATUSES)[keyof typeof LEAD_DELIVERY_STATUSES];

export interface LeadExcelRow {
  submissionTime: string;
  leadId: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  market: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  timeframe: string;
  project: string;
  newsletterOptIn: boolean;
  source: string;
  campaign: string;
  landingPage: string;
  status: "New";
  owner: string;
  notes: string;
}

export interface LeadDeliveryPayload {
  schemaVersion: typeof LEAD_DELIVERY_SCHEMA_VERSION;
  eventId: string;
  eventType: typeof LEAD_DELIVERY_EVENT_TYPE;
  leadId: string;
  row: LeadExcelRow;
}

export interface LeadDeliveryPayloadInput {
  eventId: string;
  leadId: string;
  submittedAt: Date | string;
  firstName: string;
  surname?: string | null;
  email: string;
  phone?: string | null;
  interest: string;
  market?: string | null;
  location?: string | null;
  propertyType?: string | null;
  bedrooms?: string | number | null;
  bathrooms?: string | number | null;
  timeframe?: string | null;
  project?: string | null;
  newsletterOptIn: boolean;
  source?: string | null;
  campaign?: string | null;
  landingPage?: string | null;
}

export interface LeadDeliveryOutboxRecord {
  id: string;
  leadId: string;
  payload: unknown;
  status: LeadDeliveryStatus;
  attempts: number;
  availableAt: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  deliveredAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadDeliveryOutboxRepository {
  recoverStaleLocks(staleBefore: Date, recoveredAt: Date): Promise<number>;
  listReadyIds(readyAt: Date, limit: number): Promise<string[]>;
  claim(
    id: string,
    workerId: string,
    claimedAt: Date,
  ): Promise<LeadDeliveryOutboxRecord | null>;
  markDelivered(
    id: string,
    workerId: string,
    deliveredAt: Date,
  ): Promise<boolean>;
  releaseForRetry(
    id: string,
    workerId: string,
    availableAt: Date,
    errorCode: string,
  ): Promise<boolean>;
  markDeadLetter(
    id: string,
    workerId: string,
    errorCode: string,
  ): Promise<boolean>;
}

export interface LeadDeliveryTransport {
  deliver(payload: LeadDeliveryPayload): Promise<void>;
}

export interface LeadDeliveryLogger {
  info(event: string, fields?: Record<string, number | string | boolean>): void;
  error(event: string, fields?: Record<string, number | string | boolean>): void;
}

export interface LeadDeliveryWorkerOptions {
  batchSize: number;
  maxAttempts: number;
  leaseDurationMs: number;
  baseRetryDelayMs: number;
  maxRetryDelayMs: number;
  workerId: string;
}

export interface LeadDeliveryWorkerResult {
  recovered: number;
  claimed: number;
  delivered: number;
  retried: number;
  deadLettered: number;
}
