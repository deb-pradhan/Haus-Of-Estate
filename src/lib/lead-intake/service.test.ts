import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { mkdtemp, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { BrochureStorageError, BrochureUnavailableError, getApprovedBrochure } from "@/lib/brochures/catalog";
import { buildLeadDeliveryPayload, normalizeLeadDeliveryPayload } from "@/lib/lead-delivery/payload";
import { LEAD_FORM_VERSION, PRIVACY_NOTICE_VERSION } from "./contract";
import {
  LeadConflictError,
  LeadInfrastructureError,
  LeadRateLimitError,
  LeadValidationError,
} from "./errors";
import {
  hashNormalizedLead,
  normalizeLeadRequest,
  type NormalizedLeadIntake,
} from "./normalize";
import type { LeadIntakeStore } from "./persistence";
import { scoreLead, submitLeadIntake } from "./service";
import type { PublishedProjectContext } from "./project";

function input(
  submissionId = "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
): NormalizedLeadIntake {
  return normalizeLeadRequest({
    submissionId,
    interest: "buy",
    contact: { firstName: "Alex", email: "alex@example.com" },
    privacyAcknowledged: true,
    overseasCashBuyer: false,
    propertyMatchOptIn: false,
    newsletterOptIn: false,
    formVersion: LEAD_FORM_VERSION,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    context: { surface: "modal", pagePath: "/" },
  });
}

function dependencies(store: LeadIntakeStore) {
  return {
    store,
    resolveProject: vi.fn(async () => undefined),
    now: () => new Date("2026-08-29T12:00:00.000Z"),
    randomId: vi
      .fn()
      .mockReturnValueOnce("lead-id")
      .mockReturnValueOnce("outbox-id"),
  };
}

describe("submitLeadIntake", () => {
  function brochureFixture() {
    const value = input();
    value.project = { slug: "florence-villas" };
    value.brochure = { designId: "villa-a" };
    const project: PublishedProjectContext = {
      slug: "florence-villas",
      title: "Florence Villas",
      designVariants: [
        { _key: "villa-a", label: "Villa Type A", brochureKey: "florence-4br", brochureRevision: "2026-10" },
        { _key: "villa-b", label: "Villa Type B", brochureKey: "florence-4br", brochureRevision: "2026-10" },
      ],
    };
    const store: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(async (submission) => ({
        created: true,
        leadId: submission.leadId,
        submissionId: submission.input.submissionId,
        score: submission.scoring.score,
        tier: submission.scoring.tier,
        ...(submission.brochure ? { brochureQueued: true as const } : {}),
      })),
    };
    const deps = {
      ...dependencies(store),
      resolveProject: vi.fn(async () => project),
      resolveBrochure: vi.fn(async () => ({})),
    };
    return { value, project, store, deps };
  }

  it("resolves a brochure from published metadata without requiring marketing consent", async () => {
    const { value, store, deps } = brochureFixture();
    value.contact.firstName = "+Alex";
    value.contact.email = "+alex@example.com";
    await expect(submitLeadIntake(value, "ip-hash", deps)).resolves.toMatchObject({ brochureQueued: true });
    expect(deps.resolveBrochure).toHaveBeenCalledWith("florence-4br", "2026-10", "florence-villas");
    expect(store.persistSubmission).toHaveBeenCalledWith(expect.objectContaining({
      brochure: {
        key: "florence-4br",
        revision: "2026-10",
        projectSlug: "florence-villas",
        projectTitle: "Florence Villas",
        designId: "villa-a",
        designLabel: "Villa Type A",
        recipientName: "+Alex",
        recipientEmail: "+alex@example.com",
      },
      input: expect.objectContaining({ newsletterOptIn: false, propertyMatchOptIn: false }),
    }));
  });

  it("resolves an approved private PDF into the worker payload and rejects withdrawn approval", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "haus-brochure-intake-test-"));
    const filename = "synthetic-brochure.pdf";
    const pdfPath = path.join(root, filename);
    const catalogPath = path.join(root, "catalog.json");
    const pdf = Buffer.from("%PDF-1.4\nSynthetic test content only\n%%EOF\n");
    const sha256 = createHash("sha256").update(pdf).digest("hex");
    const entry = {
      key: "florence-4br", revision: sha256, filename, sha256,
      propertySlugs: ["florence-villas"], approved: true,
    };
    const environment = {
      BROCHURE_EMAIL_ENABLED: "true",
      BROCHURE_FILES_ROOT: root,
      BROCHURE_CATALOG_PATH: catalogPath,
    };
    try {
      await writeFile(pdfPath, pdf);
      await writeFile(catalogPath, JSON.stringify({ schemaVersion: 1, entries: [entry] }));
      const { value, project, store, deps } = brochureFixture();
      project.designVariants!.forEach((design) => { design.brochureRevision = sha256; });
      const realCatalogueDependencies = {
        ...deps,
        resolveBrochure: (key: string, revision: string, projectSlug: string) =>
          getApprovedBrochure(key, revision, projectSlug, environment),
      };
      await submitLeadIntake(value, "ip-hash", realCatalogueDependencies);
      const persisted = vi.mocked(store.persistSubmission).mock.calls[0][0];
      const payload = buildLeadDeliveryPayload({
        eventId: `${persisted.outboxId}-brochure`,
        leadId: persisted.leadId,
        submittedAt: persisted.submittedAt,
        firstName: value.contact.firstName,
        email: value.contact.email,
        interest: value.interest,
        propertyMatchOptIn: false, newsletterOptIn: false, overseasCashBuyer: false,
        brochure: persisted.brochure,
      });
      expect(normalizeLeadDeliveryPayload(payload)?.brochure).toMatchObject({
        key: entry.key, revision: sha256,
        projectSlug: "florence-villas", designId: "villa-a",
        recipientEmail: "alex@example.com",
      });
      expect(payload.brochure).not.toHaveProperty("filePath");
      expect(payload.brochure).not.toHaveProperty("url");
      await writeFile(catalogPath, JSON.stringify({ schemaVersion: 1, entries: [{ ...entry, approved: false }] }));
      vi.mocked(store.persistSubmission).mockClear();
      await expect(submitLeadIntake(value, "ip-hash", realCatalogueDependencies))
        .rejects.toBeInstanceOf(LeadValidationError);
      expect(store.persistSubmission).not.toHaveBeenCalled();
    } finally {
      await unlink(pdfPath).catch(() => undefined);
      await unlink(catalogPath).catch(() => undefined);
      await rmdir(root);
    }
  });

  it("only accepts a collection brochure when every design resolves to one revision", async () => {
    const { value, project, store, deps } = brochureFixture();
    value.brochure = {};
    await submitLeadIntake(value, "ip-hash", deps);
    expect(store.persistSubmission).toHaveBeenCalledWith(expect.objectContaining({
      brochure: expect.not.objectContaining({ designId: expect.anything() }),
    }));
    vi.mocked(store.persistSubmission).mockClear();
    project.designVariants![1].brochureRevision = "other";
    await expect(submitLeadIntake(value, "ip-hash", deps)).rejects.toBeInstanceOf(LeadValidationError);
    expect(store.persistSubmission).not.toHaveBeenCalled();
    project.designVariants![1].brochureRevision = undefined;
    await expect(submitLeadIntake(value, "ip-hash", deps)).rejects.toBeInstanceOf(LeadValidationError);
  });

  it("preserves a brochure request for retry after a temporary storage failure without saving a partial enquiry", async () => {
    const { value, store, deps } = brochureFixture();
    const originalRequest = structuredClone(value);
    deps.resolveBrochure.mockRejectedValueOnce(new BrochureStorageError());

    await expect(submitLeadIntake(value, "ip-hash", deps)).rejects.toBeInstanceOf(LeadInfrastructureError);
    expect(store.persistSubmission).not.toHaveBeenCalled();
    expect(value).toEqual(originalRequest);

    await expect(submitLeadIntake(value, "ip-hash", deps)).resolves.toMatchObject({ brochureQueued: true });
    expect(store.persistSubmission).toHaveBeenCalledOnce();
    expect(store.persistSubmission).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({ submissionId: originalRequest.submissionId, brochure: { designId: "villa-a" } }),
      brochure: expect.objectContaining({ key: "florence-4br", revision: "2026-10", designId: "villa-a" }),
    }));
  });

  it("keeps missing or unapproved brochures as field-validation failures without persisting", async () => {
    const { value, store, deps } = brochureFixture();
    deps.resolveBrochure.mockRejectedValue(new BrochureUnavailableError());

    await expect(submitLeadIntake(value, "ip-hash", deps)).rejects.toMatchObject({
      name: "LeadValidationError",
      fieldErrors: { brochure: ["This brochure cannot be emailed right now. You can still send a property enquiry."] },
    });
    expect(store.persistSubmission).not.toHaveBeenCalled();
  });

  it("rejects unpublished, mismatched, unknown and unapproved selections before persisting", async () => {
    const { value, project, store, deps } = brochureFixture();
    value.brochure = { designId: "unknown" };
    await expect(submitLeadIntake(value, "ip-hash", deps)).rejects.toBeInstanceOf(LeadValidationError);
    value.brochure = { designId: "villa-a" };
    project.slug = "other-property";
    await expect(submitLeadIntake(value, "ip-hash", deps)).rejects.toBeInstanceOf(LeadValidationError);
    project.slug = "florence-villas";
    deps.resolveBrochure.mockRejectedValue(new Error("not approved"));
    await expect(submitLeadIntake(value, "ip-hash", deps)).rejects.toMatchObject({ fieldErrors: { brochure: expect.any(Array) } });
    await expect(submitLeadIntake(value, "ip-hash", {
      ...deps, resolveProject: async () => undefined,
    })).rejects.toBeInstanceOf(LeadValidationError);
    expect(store.persistSubmission).not.toHaveBeenCalled();
  });

  it("fails closed when brochure email is disabled but accepts an ordinary enquiry", async () => {
    const { value, store, deps } = brochureFixture();
    vi.stubEnv("BROCHURE_EMAIL_ENABLED", "false");
    try {
      await expect(submitLeadIntake(value, "ip-hash", {
        ...deps, resolveBrochure: undefined,
      })).rejects.toBeInstanceOf(LeadValidationError);
      delete value.brochure;
      await submitLeadIntake(value, "ip-hash", { ...deps, resolveBrochure: undefined });
      expect(store.persistSubmission).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rejects a replay of the same submission ID with a different design", async () => {
    const { value, store, deps } = brochureFixture();
    vi.mocked(store.findSubmission).mockResolvedValue({
      id: "saved-lead", submissionId: value.submissionId,
      payloadHash: hashNormalizedLead(value), score: 30, tier: "nurture",
      deliveryOutbox: [{ id: "saved-brochure", destination: "customer_brochure" }],
    });
    await expect(submitLeadIntake(value, "ip-hash", deps)).resolves.toMatchObject({ created: false, brochureQueued: true });
    expect(deps.resolveBrochure).not.toHaveBeenCalled();
    value.brochure = { designId: "villa-b" };
    await expect(submitLeadIntake(value, "ip-hash", deps)).rejects.toBeInstanceOf(LeadConflictError);
    expect(store.persistSubmission).not.toHaveBeenCalled();
  });

  it("returns an identical idempotent replay without persisting again", async () => {
    const value = input();
    const store: LeadIntakeStore = {
      findSubmission: vi.fn(async () => ({
        id: "lead-existing",
        submissionId: value.submissionId,
        payloadHash: hashNormalizedLead(value),
        score: 30,
        tier: "nurture",
        deliveryOutbox: [{ id: "outbox-existing" }],
      })),
      persistSubmission: vi.fn(),
    };

    const result = await submitLeadIntake(
      value,
      "ip-hash",
      dependencies(store),
    );
    expect(result.created).toBe(false);
    expect(result.leadId).toBe("lead-existing");
    expect(store.persistSubmission).not.toHaveBeenCalled();
  });

  it("rejects a reused submission ID with different content", async () => {
    const value = input();
    const store: LeadIntakeStore = {
      findSubmission: vi.fn(async () => ({
        id: "lead-existing",
        submissionId: value.submissionId,
        payloadHash: "different-hash",
        score: 30,
        tier: "nurture",
      })),
      persistSubmission: vi.fn(),
    };

    await expect(
      submitLeadIntake(value, "ip-hash", dependencies(store)),
    ).rejects.toBeInstanceOf(LeadConflictError);
  });

  it("creates separate enquiries that share an email", async () => {
    const store: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(async (submission) => ({
        created: true,
        leadId: submission.leadId,
        submissionId: submission.input.submissionId,
        score: submission.scoring.score,
        tier: submission.scoring.tier,
        outboxId: submission.outboxId,
      })),
    };

    await submitLeadIntake(input(), "ip-hash", dependencies(store));
    await submitLeadIntake(
      input("254cf874-d27b-4698-a610-ab02eb860389"),
      "ip-hash",
      dependencies(store),
    );
    expect(store.persistSubmission).toHaveBeenCalledTimes(2);
  });

  it("allows an old idempotent replay but rejects a new expired form", async () => {
    const expired = normalizeLeadRequest({
      submissionId: "bda96f42-222f-498b-92a0-f07e2771d875",
      interest: "buy",
      contact: { firstName: "Alex", email: "alex@example.com" },
      overseasCashBuyer: false,
      propertyMatchOptIn: false,
      newsletterOptIn: false,
      formVersion: "2026-09-01.v3",
      privacyNoticeVersion: "2026-09-01",
      context: { surface: "modal", pagePath: "/" },
    });
    const replayStore: LeadIntakeStore = {
      findSubmission: vi.fn(async () => ({
        id: "lead-existing",
        submissionId: expired.submissionId,
        payloadHash: hashNormalizedLead(expired),
        score: 30,
        tier: "nurture",
      })),
      persistSubmission: vi.fn(),
    };
    await expect(
      submitLeadIntake(expired, "ip-hash", dependencies(replayStore)),
    ).resolves.toMatchObject({ created: false, leadId: "lead-existing" });

    const newStore: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(),
    };
    await expect(
      submitLeadIntake(expired, "ip-hash", dependencies(newStore)),
    ).rejects.toBeInstanceOf(LeadValidationError);
    expect(newStore.persistSubmission).not.toHaveBeenCalled();
  });

  it("propagates throttling and database failures without reporting success", async () => {
    const throttledStore: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(async () => {
        throw new LeadRateLimitError(60);
      }),
    };
    await expect(
      submitLeadIntake(input(), "ip-hash", dependencies(throttledStore)),
    ).rejects.toBeInstanceOf(LeadRateLimitError);

    const failedStore: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(async () => {
        throw new Error("database unavailable");
      }),
    };
    await expect(
      submitLeadIntake(input(), "ip-hash", dependencies(failedStore)),
    ).rejects.toThrow("database unavailable");
  });
});

describe("scoreLead", () => {
  it("preserves legacy scoring and routing when compatibility payloads migrate", () => {
    const legacy = normalizeLeadRequest({
      intent: "buyer",
      buyOrRent: "buy",
      useType: "investment",
      market: "dubai",
      area: "palm",
      firstName: "Alex",
      email: "alex@example.com",
      mobile: "+447700900123",
      consentGiven: true,
    });
    expect(scoreLead(legacy)).toEqual({
      score: 45,
      tier: "warm",
      routing: "luxury",
    });
  });

  it("routes the country-labelled UAE buyer value without losing Dubai behavior", () => {
    const uaeBuyer = input();
    uaeBuyer.preferences.market = "United Arab Emirates";
    expect(scoreLead(uaeBuyer).routing).toBe("luxury");
  });
});

describe("submitLeadIntake with a launch interest", () => {
  function launchFixture() {
    const value = input();
    value.launchInterest = { key: "palm-springs-by-nakheel" };
    value.context = { surface: "launch_article", pagePath: "/blog/palm-springs-by-nakheel-dubai" };
    const store: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(async (submission) => ({
        created: true,
        leadId: submission.leadId,
        submissionId: submission.input.submissionId,
        score: submission.scoring.score,
        tier: submission.scoring.tier,
      })),
    };
    return { value, store, deps: dependencies(store) };
  }

  it("resolves the launch from the code allowlist as the lead's project and never asks the CMS", async () => {
    const { value, store, deps } = launchFixture();
    await submitLeadIntake(value, "ip-hash", deps);
    expect(deps.resolveProject).not.toHaveBeenCalled();
    expect(store.persistSubmission).toHaveBeenCalledWith(expect.objectContaining({
      project: { slug: "palm-springs-by-nakheel", title: "Palm Springs by Nakheel (pre-launch interest)", community: "Jebel Ali, Dubai" },
      brochure: undefined,
    }));
  });

  it("rejects an unknown launch key before persisting", async () => {
    const { value, store, deps } = launchFixture();
    value.launchInterest = { key: "palm-jebel-ali-phase-9" };
    await expect(submitLeadIntake(value, "ip-hash", deps)).rejects.toMatchObject({ fieldErrors: { launchInterest: ["Select a current launch"] } });
    expect(store.persistSubmission).not.toHaveBeenCalled();
  });
});
