import { describe, expect, it } from "vitest";
import { buildShareIntentLinks, canonicalHausUrl } from "./share";

describe("canonicalHausUrl", () => {
  it("builds stable blog and property URLs without tracking or fragments", () => {
    expect(canonicalHausUrl("/blog/market-update?utm_source=x#summary")).toBe(
      "https://hausofestate.com/blog/market-update",
    );
    expect(
      canonicalHausUrl(
        "https://hausofestate.com/properties/monaco-mansions?ref=email#gallery",
      ),
    ).toBe("https://hausofestate.com/properties/monaco-mansions");
  });

  it("rejects external and shortened origins", () => {
    expect(() => canonicalHausUrl("https://example.com/property")).toThrow(
      "canonical origin",
    );
    expect(() => canonicalHausUrl("https://bit.ly/example")).toThrow(
      "canonical origin",
    );
  });
});

describe("buildShareIntentLinks", () => {
  it("encodes the exact canonical URL and human-readable copy", () => {
    const links = buildShareIntentLinks({
      url: "/properties/cote-d-azur?utm_campaign=test#hero",
      title: "Homes & views in Côte d'Azur",
      text: "View this Haus property",
    });
    const canonical = "https://hausofestate.com/properties/cote-d-azur";

    expect(links.map((link) => link.id)).toEqual([
      "whatsapp",
      "email",
      "facebook",
      "linkedin",
      "x",
      "pinterest",
    ]);
    for (const link of links) {
      expect(decodeURIComponent(link.href)).toContain(canonical);
    }
    expect(links.find((link) => link.id === "x")?.href).toContain(
      "text=View%20this%20Haus%20property",
    );
  });
});
