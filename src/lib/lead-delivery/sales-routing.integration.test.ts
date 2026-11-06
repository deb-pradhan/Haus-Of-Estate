import { afterEach, describe, expect, it, vi } from "vitest";
import { LEAD_FORM_VERSION, PRIVACY_NOTICE_VERSION } from "@/lib/lead-intake/contract";
import { normalizeLeadRequest } from "@/lib/lead-intake/normalize";
import type { LeadIntakeStore } from "@/lib/lead-intake/persistence";
import { submitLeadIntake } from "@/lib/lead-intake/service";
import { buildLeadDeliveryPayload } from "./payload";
import {
  attemptImmediateLeadDelivery,
  createDestinationLeadDeliveryTransport,
  enabledLeadDeliveryDestinations,
  runConfiguredLeadDeliveryWorker,
} from "./runtime";

const catalogue = vi.hoisted(() => ({ approved: vi.fn() }));
vi.mock("@/lib/brochures/catalog", async (original) => ({
  ...await original<typeof import("@/lib/brochures/catalog")>(),
  getApprovedBrochure: catalogue.approved,
}));

const environment = {
  NODE_ENV: "test",
  RESEND_API_KEY: "test-only-not-a-real-key",
  RESEND_FROM_EMAIL: "noreply@hausofestate.com",
  LEAD_DELIVERY_PROVIDER: "resend",
  LEAD_DELIVERY_ENABLED: "true",
  LEAD_NOTIFICATIONS_ENABLED: "true",
  LEAD_NOTIFICATION_TO: "sales@hausofestate.com",
  BROCHURE_EMAIL_ENABLED: "true",
  BROCHURE_REPLY_TO: "sales@hausofestate.com",
  BROCHURE_LINK_SECRET: "test-only-signing-secret-longer-than-32",
  BROCHURE_PUBLIC_ORIGIN: "https://hausofestate.com",
  BROCHURE_FILES_ROOT: "/private/brochures",
  BROCHURE_CATALOG_PATH: "/private/catalog.json",
};

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("confirmed sales routing across enquiry and brochure delivery", () => {
  it("keeps the requested brochure and staff notification separate without marketing opt-in", async () => {
    const now = new Date("2026-11-06T12:00:00Z");
    vi.spyOn(Date, "now").mockReturnValue(now.getTime());
    const send = vi.fn<typeof fetch>().mockImplementation(async () =>
      new Response(JSON.stringify({ id: `test-receipt-${send.mock.calls.length}` })));
    vi.stubGlobal("fetch", send);
    catalogue.approved.mockResolvedValue({ filename: "synthetic-brochure.pdf" });

    const input = normalizeLeadRequest({
      submissionId: "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
      interest: "buy",
      contact: { firstName: "Test Buyer", email: "buyer@example.test" },
      privacyAcknowledged: true,
      newsletterOptIn: false,
      propertyMatchOptIn: false,
      overseasCashBuyer: false,
      formVersion: LEAD_FORM_VERSION,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      context: { surface: "modal", pagePath: "/properties/azizi-florence-4-bedroom-villas" },
      project: { slug: "azizi-florence-4-bedroom-villas" },
      brochure: { designId: "villa-a" },
    });
    const store: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(async (saved) => ({
        created: true, leadId: saved.leadId, submissionId: saved.input.submissionId,
        score: saved.scoring.score, tier: saved.scoring.tier, brochureQueued: true as const,
      })),
    };
    await expect(submitLeadIntake(input, "synthetic-ip-hash", {
      store,
      resolveProject: async () => ({
        slug: "azizi-florence-4-bedroom-villas", title: "Florence 4-Bedroom Villas",
        designVariants: [{ _key: "villa-a", label: "Villa Type A", brochureKey: "villa-4br", brochureRevision: "a".repeat(64) }],
      }),
      resolveBrochure: async () => ({}),
      now: () => now,
      randomId: vi.fn().mockReturnValueOnce("test-lead").mockReturnValueOnce("test-outbox"),
    })).resolves.toMatchObject({ brochureQueued: true });

    const saved = vi.mocked(store.persistSubmission).mock.calls[0][0];
    expect(saved.input).toMatchObject({ newsletterOptIn: false, propertyMatchOptIn: false });
    const payload = buildLeadDeliveryPayload({
      eventId: saved.outboxId, leadId: saved.leadId, submittedAt: saved.submittedAt,
      firstName: saved.input.contact.firstName, email: saved.input.contact.email,
      interest: saved.input.interest, brochure: saved.brochure,
      newsletterOptIn: saved.input.newsletterOptIn,
      propertyMatchOptIn: saved.input.propertyMatchOptIn,
      overseasCashBuyer: saved.input.overseasCashBuyer,
    });
    const transport = createDestinationLeadDeliveryTransport(environment);
    const context = { attempts: 1, createdAt: now };
    await transport.deliver(payload, "customer_brochure", context);
    await transport.deliver(payload, "notification", context);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.every(([url]) => url === "https://api.resend.com/emails")).toBe(true);
    const [brochure, notification] = send.mock.calls.map(([, request]) => JSON.parse(String(request?.body)));
    expect(brochure.to).toEqual(["buyer@example.test"]);
    expect(brochure.reply_to).toBe("sales@hausofestate.com");
    expect(brochure.text).toContain("Villa Type A");
    expect(brochure.text).toContain("does not subscribe you to marketing emails");
    expect(notification.to).toEqual(["sales@hausofestate.com"]);
    expect(notification.reply_to).toBe("buyer@example.test");
    expect(notification.text).toContain("Newsletter opt-in: No");
    expect(notification.text).toContain("Property match opt-in: No");
  });

  it("keeps configured mailboxes inert while delivery and destination gates are disabled", async () => {
    const send = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", send);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const disabled = {
      ...environment, LEAD_DELIVERY_ENABLED: "false",
      LEAD_NOTIFICATIONS_ENABLED: "false", BROCHURE_EMAIL_ENABLED: "false",
      LEAD_SHEETS_ENABLED: "false",
    };
    expect(enabledLeadDeliveryDestinations(disabled)).toEqual([]);
    await expect(attemptImmediateLeadDelivery("test-outbox", disabled)).resolves.toBe("disabled");
    await expect(runConfiguredLeadDeliveryWorker(disabled)).resolves.toBe("disabled");
    expect(enabledLeadDeliveryDestinations({ ...disabled, LEAD_NOTIFICATIONS_ENABLED: "true" })).toEqual(["notification"]);
    expect(enabledLeadDeliveryDestinations({ ...disabled, BROCHURE_EMAIL_ENABLED: "true" })).toEqual(["customer_brochure"]);
    expect(send).not.toHaveBeenCalled();
  });
});
