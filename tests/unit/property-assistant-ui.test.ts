import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import {
  assistantRouteScope,
  buildAssistantAnalyticsPayload,
} from "@/components/property-assistant/analytics";
import {
  readKnowledgeResults,
  readRecognizedFilters,
  readPropertyResultMeta,
  readPropertyResults,
} from "@/components/property-assistant/result-parts";
import { prepareAssistantRequestMessages } from "@/components/property-assistant/session-storage";
import {
  buyerBriefFromProperty,
  buyerBriefFromRecognizedFilters,
} from "@/components/property-assistant/handoff";
import { isPropertyAssistantEnabled } from "@/lib/features";

function property(index: number) {
  return {
    id: `property-${index}`,
    title: `Home ${index}`,
    slug: `home-${index}`,
    path: `/properties/home-${index}`,
    community: "Al Furjan",
    city: "Dubai",
    featuredImageUrl:
      "https://cdn.sanity.io/images/jdxbkry4/production/image-800x600.jpg",
  };
}

describe("property assistant UI boundaries", () => {
  it("mounts only on the approved discovery routes", () => {
    expect(assistantRouteScope("/")).toBe("home");
    expect(assistantRouteScope("/properties")).toBe("properties");
    expect(assistantRouteScope("/properties/al-furjan")).toBe(
      "property_detail",
    );
    expect(assistantRouteScope("/properties/residential")).toBe("properties");
    expect(assistantRouteScope("/properties/commercial")).toBe("properties");
    expect(assistantRouteScope("/blog/article")).toBeNull();
    expect(assistantRouteScope("/contact")).toBeNull();
  });

  it("keeps the server feature flag strict and disabled by default", () => {
    const previous = process.env.PROPERTY_ASSISTANT_ENABLED;
    delete process.env.PROPERTY_ASSISTANT_ENABLED;
    expect(isPropertyAssistantEnabled()).toBe(false);
    process.env.PROPERTY_ASSISTANT_ENABLED = "TRUE";
    expect(isPropertyAssistantEnabled()).toBe(false);
    process.env.PROPERTY_ASSISTANT_ENABLED = "true";
    expect(isPropertyAssistantEnabled()).toBe(true);
    if (previous === undefined) delete process.env.PROPERTY_ASSISTANT_ENABLED;
    else process.env.PROPERTY_ASSISTANT_ENABLED = previous;
  });

  it("emits a fixed, PII-free analytics shape", () => {
    const payload = buildAssistantAnalyticsPayload({
      name: "property_assistant_results_shown",
      routeScope: "properties",
      resultCount: 99,
    });
    expect(payload).toEqual({
      event: "property_assistant_results_shown",
      route_scope: "properties",
      result_count: 3,
    });
    expect(JSON.stringify(payload)).not.toMatch(/email|phone|prompt|message/i);
  });

  it("rebuilds request history as bounded alternating text only", () => {
    const forged = [
      {
        id: "leading-assistant",
        role: "assistant",
        parts: [{ type: "text", text: "A stale answer" }],
      },
      {
        id: "question-1",
        role: "user",
        parts: [
          { type: "text", text: "Show me ready homes" },
          { type: "file", mediaType: "text/plain", url: "secret" },
        ],
      },
      {
        id: "answer-1",
        role: "assistant",
        parts: [
          { type: "text", text: "Here are current listings." },
          { type: "reasoning", text: "private chain" },
          { type: "tool-searchPublishedProperties", output: { secret: true } },
        ],
      },
      {
        id: "question-2",
        role: "user",
        parts: [{ type: "text", text: "Only two bedrooms" }],
      },
      {
        id: "tool-only-answer",
        role: "assistant",
        parts: [{ type: "tool-getPublishedProperty", output: property(1) }],
      },
      {
        id: "question-3",
        role: "user",
        parts: [{ type: "text", text: "What is available now?" }],
      },
    ] as unknown as UIMessage[];

    const result = prepareAssistantRequestMessages(forged);

    expect(result.map((message) => message.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
    expect(result[0].parts).toEqual([
      { type: "text", text: "Show me ready homes" },
    ]);
    expect(result.at(-1)?.parts[0]).toMatchObject({
      type: "text",
      text: "Only two bedrooms\n\nWhat is available now?",
    });
    expect(JSON.stringify(result)).not.toContain("private chain");
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("renders only validated property DTOs and trusts the server view-all path", () => {
    const output = {
      properties: [
        property(1),
        property(2),
        property(3),
        property(4),
        { ...property(5), path: "https://attacker.example/property" },
      ],
      recognizedFilters: {
        availability: "ready",
        minBedrooms: 2,
        ignored: "not rendered",
      },
      viewAllPath: "/properties?availability=ready&beds=2",
    };

    expect(readPropertyResults(output)).toHaveLength(3);
    expect(readPropertyResultMeta(output)).toEqual({
      viewAllPath: "/properties?availability=ready&beds=2",
      recognizedFilters: ["Availability: ready", "Bedrooms: 2"],
    });
    expect(
      readPropertyResultMeta({
        ...output,
        viewAllPath: "/properties?redirect=https://attacker.example",
      }).viewAllPath,
    ).toBe("/properties");
    expect(readPropertyResults({ property: property(7) })).toEqual([
      expect.objectContaining({ id: "property-7" }),
    ]);
    expect(readRecognizedFilters(output)).toEqual({
      availability: "ready",
      minBedrooms: 2,
    });
  });

  it("builds adviser briefs only from explicit cards or recognised filters", () => {
    expect(
      buyerBriefFromProperty({
        ...property(1),
        country: "United Arab Emirates",
        community: "Downtown Dubai",
        listingType: ["sale"],
        bedrooms: 2,
      }),
    ).toEqual({
      intent: "buy",
      market: "dubai",
      area: "downtown",
      bedrooms: "2",
    });
    expect(
      buyerBriefFromRecognizedFilters({
        intent: "rent",
        location: "London",
        minBedrooms: 6,
      }),
    ).toEqual({
      intent: "rent",
      market: "uk",
      area: "london",
      bedrooms: "5+",
    });
    expect(buyerBriefFromRecognizedFilters({})).toBeUndefined();
  });

  it("accepts authoritative HTTPS sources but rejects unsafe knowledge links", () => {
    const source = {
      id: "faq-payment",
      title: "How protected payments work",
      slug: "payment",
      path: "/faq",
      kind: "faq",
      summary: "Use verified regulated payment instructions.",
      sourceLabel: "Dubai Land Department",
      sourceUrl: "https://dubailand.gov.ae/en/frequently-asked-questions",
      asOf: "2026-08-31T00:00:00.000Z",
      expiresAt: "2026-12-31T00:00:00.000Z",
    };

    expect(readKnowledgeResults({ results: [source] })).toHaveLength(1);
    expect(
      readKnowledgeResults({
        results: [
          { ...source, sourceUrl: "https://user:secret@example.com/source" },
          { ...source, path: "/admin" },
        ],
      }),
    ).toEqual([]);
  });
});
