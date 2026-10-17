import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import nextConfig from "../next.config.ts";
import { COMPANY_IDENTITY } from "../src/lib/company-identity.ts";
import {
  DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGES, DEFAULT_TITLE, DESCRIPTION_MAX, DESCRIPTION_MIN, SITEMAP_STATIC_ROUTES,
  TITLE_MAX, THIN_POST_WORDS, absoluteUrl, blogDescription, blogTitle, breadcrumbJsonLd, buildRobots,
  buildSitemapEntries, faqJsonLd, isThinPost, pageMetadata, propertyMetadata, propertyTitle, serializeJsonLd,
  postalAddressFromRegisteredOffice, siteJsonLd, truncateAtWord,
} from "../src/lib/seo.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("www requests permanently redirect to the canonical host", async () => {
  assert.equal(typeof nextConfig.redirects, "function");

  const redirects = await nextConfig.redirects();
  assert.deepEqual(redirects, [
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.hausofestate.com" }],
      destination: "https://hausofestate.com/:path*",
      permanent: true,
    },
  ]);
});

test("unapproved public review-platform links stay hidden", async () => {
  const reviewsSource = await readFile(
    new URL(
      "../src/components/landing/reviews-carousel.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(reviewsSource, /trustpilot/i);
  assert.doesNotMatch(reviewsSource, /google\.com\/search/i);
  assert.doesNotMatch(reviewsSource, /reviews on google/i);
});

// ── Canonicals, robots, lang ────────────────────────────────────────────────

test("root layout sets no global canonical, uses en-GB and renders one site graph", async () => {
  const layout = await read("src/app/layout.tsx");
  assert.doesNotMatch(layout.replace(/\/\/.*$/gm, ""), /canonical|alternates\s*:/, "no canonical in root metadata");
  assert.match(layout, /<html lang="en-GB"/);
  assert.doesNotMatch(layout, /priceRange/);
  assert.match(layout, /siteJsonLd\(COMPANY_IDENTITY\)/);
});

test("every indexable static route declares its own canonical (home is the root default)", async () => {
  const sources = {
    "/properties": ["src/app/(main)/properties/page.tsx"],
    "/about": ["src/app/(main)/about/layout.tsx"],
    "/services": ["src/app/(main)/services/layout.tsx"],
    "/renovations": ["src/app/(main)/renovations/layout.tsx"],
    "/team": ["src/app/(main)/team/page.tsx"],
    "/faq": ["src/app/(main)/faq/page.tsx"],
    "/blog": ["src/app/(main)/blog/page.tsx"],
    "/list-property": ["src/app/(main)/list-property/layout.tsx"],
    "/contact": ["src/app/(main)/contact/page.tsx"],
    "/legal/privacy-policy": ["src/app/(main)/legal/privacy-policy/page.tsx"],
    "/legal/terms-of-service": ["src/app/(main)/legal/terms-of-service/page.tsx"],
    "/legal/cookie-policy": ["src/app/(main)/legal/cookie-policy/page.tsx"],
  };
  for (const { path } of SITEMAP_STATIC_ROUTES) {
    if (path === "/") continue;
    assert.ok(sources[path], `${path} has no declared metadata source in this test`);
    const bodies = await Promise.all(sources[path].map(read));
    const declared = bodies.some((body) => new RegExp(`canonical\\s*:\\s*['"]${path}['"]`).test(body) || (body.includes("pageMetadata(") && (new RegExp(`path:\\s*['"]${path}['"]`).test(body) || (path === "/blog" && /path,\s*\n/.test(body) && body.includes("'/blog'")))));
    assert.ok(declared, `${path} must declare canonical ${path}`);
  }
});

test("funnel and utility routes are noindex and disallowed in robots.txt", async () => {
  assert.match(await read("src/app/(funnel)/match/layout.tsx"), /robots:\s*\{\s*index:\s*false/);
  const robots = buildRobots();
  assert.equal(robots.sitemap, "https://hausofestate.com/sitemap.xml");
  assert.equal("host" in robots, false, "host is a Yandex-only directive");
  assert.deepEqual(robots.rules, { userAgent: "*", allow: "/", disallow: ["/api/", "/studio/", "/auth/"] });
  assert.match(await read("src/app/robots.ts"), /buildRobots\(\)/);
});

test("pageMetadata builds a self-referencing canonical with matching social blocks", () => {
  const meta = pageMetadata({ title: "Sell or Let Your Property", description: "x".repeat(130), path: "/list-property" });
  assert.equal(meta.title, "Sell or Let Your Property");
  assert.equal(meta.alternates.canonical, "/list-property");
  assert.equal(meta.openGraph.url, "/list-property");
  assert.equal(meta.openGraph.title, "Sell or Let Your Property | Haus of Estate");
  assert.deepEqual(meta.openGraph.images, DEFAULT_OG_IMAGES);
  assert.deepEqual(meta.twitter.images, ["/opengraph-image.png"]);
  assert.equal(meta.robots, undefined);
  assert.deepEqual(pageMetadata({ title: "T", description: "d", path: "/x", noindex: true }).robots, { index: false, follow: true });
});

test("site and list-property metadata respect length rules and make no unverifiable claims", async () => {
  assert.ok(DEFAULT_TITLE.length <= TITLE_MAX, DEFAULT_TITLE);
  for (const description of [DEFAULT_DESCRIPTION]) {
    assert.ok(description.length >= DESCRIPTION_MIN && description.length <= DESCRIPTION_MAX, `${description.length}: ${description}`);
  }
  const listLayout = await read("src/app/(main)/list-property/layout.tsx");
  const title = listLayout.match(/title:\s*"([^"]+)"/)[1];
  const description = listLayout.match(/description:\s*\n?\s*"([^"]+)"/)[1];
  assert.ok(title.length + " | Haus of Estate".length <= TITLE_MAX);
  assert.ok(description.length >= DESCRIPTION_MIN && description.length <= DESCRIPTION_MAX, `${description.length}`);
  for (const text of [DEFAULT_TITLE, DEFAULT_DESCRIPTION, description]) {
    assert.doesNotMatch(text, /within \d+ hours?|\d[\d,]*\+|\d(\.\d)?\s?★|years'? experience|no hidden fees|vetted/i, text);
  }
});

// ── Structured data ─────────────────────────────────────────────────────────

test("site JSON-LD: one consistent Organization/RealEstateAgent, WebSite, no risky markup", () => {
  const graph = siteJsonLd(COMPANY_IDENTITY)["@graph"];
  const orgs = graph.filter((node) => [].concat(node["@type"]).includes("Organization"));
  assert.equal(orgs.length, 1);
  const org = orgs[0];
  assert.deepEqual(org["@type"], ["Organization", "RealEstateAgent"]);
  assert.equal("priceRange" in org, false);
  assert.equal(org.legalName, COMPANY_IDENTITY.legalName);
  assert.equal(org.identifier.value, COMPANY_IDENTITY.number);
  // Address is the registered office from company-identity.ts, nothing else.
  assert.deepEqual(org.address, {
    "@type": "PostalAddress", streetAddress: "115 City Road, Unit 1", addressLocality: "Cardiff", addressRegion: "South Glamorgan", postalCode: "CF24 3BP", addressCountry: "GB",
  });
  assert.equal(postalAddressFromRegisteredOffice("Somewhere odd").streetAddress, "Somewhere odd");
  assert.equal(JSON.stringify(graph).match(/Unit [A-Z0-9]/g).length, 1, "a single address appears in the graph");
  assert.deepEqual([...new Set(JSON.stringify(graph).match(/\+44\d+|\+971\d+/g))].sort(), ["+447496033321", "+971585607033"]);
  assert.deepEqual([...new Set(JSON.stringify(graph).match(/[\w.]+@[\w.]+/g))], ["info@hausofestate.com"]);
  const website = graph.find((node) => node["@type"] === "WebSite");
  assert.equal(website.publisher["@id"], org["@id"]);
  assert.equal("potentialAction" in website, false, "no SearchAction: /properties has no free-text query parameter");
  assert.doesNotMatch(JSON.stringify(graph), /"(Offer|RealEstateListing|Review|AggregateRating|Product)"|aggregateRating|ratingValue/);
});

test("no Offer, listing, review or rating markup anywhere in the source", async () => {
  const files = (await readdir(new URL("../src", import.meta.url), { recursive: true })).filter((file) => /\.(tsx?|mjs)$/.test(file));
  const risky = /["']@type["']\s*:\s*["'](Offer|AggregateOffer|RealEstateListing|Review|AggregateRating|Product)["']/;
  const hits = [];
  for (const file of files) if (risky.test(await readFile(new URL(`../src/${file}`, import.meta.url), "utf8"))) hits.push(file);
  assert.deepEqual(hits, []);
});

test("breadcrumbJsonLd numbers items and resolves absolute URLs", () => {
  const list = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Insights", path: "/blog" }, { name: "A post", path: "/blog/a-post" }]);
  assert.equal(list["@type"], "BreadcrumbList");
  assert.deepEqual(list.itemListElement.map((item) => [item.position, item.name, item.item]), [
    [1, "Home", "https://hausofestate.com/"], [2, "Insights", "https://hausofestate.com/blog"], [3, "A post", "https://hausofestate.com/blog/a-post"],
  ]);
  assert.equal(absoluteUrl("https://example.com/x"), "https://example.com/x");
});

test("faqJsonLd marks up only real entries and the serializer cannot close the script tag", () => {
  assert.equal(faqJsonLd([]), null);
  assert.equal(faqJsonLd([{ question: "", answer: "a" }, { question: "q", answer: "  " }]), null);
  const faq = faqJsonLd([{ question: "Is it free?", answer: "Yes." }, { question: "Empty", answer: "" }]);
  assert.equal(faq["@type"], "FAQPage");
  assert.equal(faq.mainEntity.length, 1);
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, "Yes.");
  const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.doesNotMatch(json, /<\/script>|</);
  assert.equal(JSON.parse(json).name, "</script><script>alert(1)</script>");
});

// ── Property metadata helper ────────────────────────────────────────────────

test("propertyMetadata: title ladder, summary description, featured-image OG, self canonical", () => {
  const al = { title: "Al Furjan", slug: "al-furjan", unitType: "Apartment", community: "Al Furjan", city: "Dubai", bedrooms: null,
    summary: "A connected, family-friendly community in new Dubai — one minute from the metro, with a choice of studios, 1, 2 and 3-bedroom apartments and terrace apartments. Off-plan options." };
  const meta = propertyMetadata({ ...al, imageUrl: "https://cdn.sanity.io/images/x/y/a.jpg?w=1200&h=630&fit=crop" });
  assert.deepEqual(meta.title, { absolute: "Apartment in Al Furjan, Dubai | Haus of Estate" });
  assert.equal(meta.alternates.canonical, "/properties/al-furjan");
  assert.ok(meta.description.length <= DESCRIPTION_MAX && meta.description.endsWith("…"));
  assert.deepEqual(meta.openGraph.images, [{ url: "https://cdn.sanity.io/images/x/y/a.jpg?w=1200&h=630&fit=crop", width: 1200, height: 630, alt: "Al Furjan" }]);
  assert.deepEqual(meta.twitter.images, ["https://cdn.sanity.io/images/x/y/a.jpg?w=1200&h=630&fit=crop"]);

  assert.equal(propertyTitle({ title: "t", slug: "s", unitType: "Terraced House", community: "North London", city: "London", bedrooms: 3 }), "3-bed terraced house in North London | Haus of Estate");
  assert.equal(propertyTitle({ title: "t", slug: "s", unitType: "Villa", community: "Palm Jumeirah", city: "Dubai", bedrooms: 4 }), "4-bed villa in Palm Jumeirah, Dubai | Haus of Estate");
  // Too long with the brand: drop the brand, then the city, then fall back to the CMS title.
  const long = { title: "Azizi Monaco Mansions", slug: "m", unitType: "Mansion", community: "Azizi Monaco Mansions", city: "Dubai", bedrooms: 6 };
  const title = propertyTitle(long);
  assert.ok(title.length <= TITLE_MAX, title);
  assert.equal(title, "6-bed mansion in Azizi Monaco Mansions, Dubai".replace("6-bed mansion", "6-bed mansion"));
  assert.equal(propertyTitle({ title: "Plot 12", slug: "s" }), "Plot 12");

  const noImage = propertyMetadata({ ...al, summary: "Short summary." });
  assert.deepEqual(noImage.openGraph.images, DEFAULT_OG_IMAGES);
  assert.ok(noImage.description.endsWith("Enquire free; an advisor will reply as soon as they can."));
  assert.ok(noImage.description.length <= DESCRIPTION_MAX);
});

// ── Blog metadata rules ─────────────────────────────────────────────────────

test("blog titles drop duplicated brand text and stay within 60 characters", () => {
  assert.equal(blogTitle("Dubai Golden Visa 2026: The Property Buyer's Guide | Haus of Estate", "x"), "Dubai Golden Visa 2026: The Property Buyer's Guide");
  assert.equal(blogTitle("Dubai Escrow Accounts | Haus of Estate — Haus of Estate", "x"), "Dubai Escrow Accounts | Haus of Estate");
  assert.equal(blogTitle(undefined, "Short title"), "Short title | Haus of Estate");
  const long = blogTitle("Manchester City Yas Residences: $4.1B Abu Dhabi Waterfront Property Guide", "x");
  assert.ok(long.length <= TITLE_MAX && long.endsWith("…"), long);
});

test("blog descriptions drop keyword lists and are capped at 160 characters", () => {
  const stuffed = "Everything UK buyers need to know about the Golden Visa property route in Dubai, including thresholds, steps and costs. Keywords: golden visa, dubai property, uae residency, buy to let";
  const cleaned = blogDescription(stuffed, "");
  assert.doesNotMatch(cleaned, /keywords/i);
  assert.ok(cleaned.length <= DESCRIPTION_MAX);
  const long = blogDescription("A".repeat(10) + " word ".repeat(60), "");
  assert.ok(long.length <= DESCRIPTION_MAX && long.endsWith("…"));
  assert.equal(blogDescription("", "A short subtitle."), "A short subtitle.");
  assert.equal(blogDescription("", ""), DEFAULT_DESCRIPTION);
  assert.equal(truncateAtWord("short", 60), "short");
});

test("thin posts are noindexed by rule and left out of the sitemap", async () => {
  assert.equal(THIN_POST_WORDS, 400);
  assert.equal(isThinPost(239), true);
  assert.equal(isThinPost(400), false);
  assert.equal(isThinPost(undefined), false, "unknown length is never treated as thin");
  const post = await read("src/app/(main)/blog/[slug]/page.tsx");
  assert.match(post, /isThinPost\(data\.wordCount\)/);
  assert.match(post, /title:\s*\{\s*absolute:\s*title\s*\}/);
  assert.match(post, /dateModified:/);
  assert.match(post, /breadcrumbJsonLd\(/);
});

// ── Sitemap ─────────────────────────────────────────────────────────────────

test("sitemap: real lastModified values, indexable URLs only, no volatile dates", () => {
  const entries = buildSitemapEntries({
    posts: [
      { slug: "good-post", updatedAt: "2026-09-14T10:00:00Z", publishedAt: "2026-09-01T00:00:00Z", wordCount: 1076 },
      { slug: "other-post", updatedAt: "2026-08-01T10:00:00Z", wordCount: 900 },
      { slug: "thin-post", updatedAt: "2026-04-13T00:00:00Z", wordCount: 239 },
      { slug: "no-dates", wordCount: 800 },
    ],
    properties: [{ slug: "al-furjan", updatedAt: "2026-09-21T10:04:57Z" }, { slug: "london-home", updatedAt: "2026-10-16T10:26:39Z" }],
    faqUpdatedAt: "2026-07-20T09:00:00Z",
  });
  const byUrl = Object.fromEntries(entries.map((entry) => [entry.url, entry]));
  assert.ok(byUrl["https://hausofestate.com/blog/good-post"]);
  assert.equal(byUrl["https://hausofestate.com/blog/thin-post"], undefined, "thin posts are noindex, so not in the sitemap");
  assert.equal(byUrl["https://hausofestate.com/blog/good-post"].lastModified.toISOString(), "2026-09-14T10:00:00.000Z");
  assert.equal(byUrl["https://hausofestate.com/blog/no-dates"].lastModified, undefined, "unknown dates are omitted, never invented");
  assert.equal(byUrl["https://hausofestate.com/blog"].lastModified.toISOString(), "2026-09-14T10:00:00.000Z");
  assert.equal(byUrl["https://hausofestate.com/properties"].lastModified.toISOString(), "2026-10-16T10:26:39.000Z");
  assert.equal(byUrl["https://hausofestate.com/faq"].lastModified.toISOString(), "2026-07-20T09:00:00.000Z");
  assert.equal(byUrl["https://hausofestate.com/properties/london-home"].lastModified.toISOString(), "2026-10-16T10:26:39.000Z");
  // Static routes use their fixed constant, identical on every call.
  const again = buildSitemapEntries({});
  assert.equal(byUrl["https://hausofestate.com/about"].lastModified.getTime(), again.find((entry) => entry.url.endsWith("/about")).lastModified.getTime());
  assert.ok(again.every((entry) => entry.lastModified.getTime() < Date.now()));
  assert.ok(entries.every((entry) => !("priority" in entry) && !("changeFrequency" in entry)));
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length, "no duplicate URLs");
  const urls = entries.map((entry) => new URL(entry.url).pathname);
  for (const excluded of ["/match", "/careers", "/properties/residential", "/properties/commercial"]) assert.equal(urls.includes(excluded), false, excluded);
  assert.equal(urls.some((path) => /^\/(auth|api|studio)/.test(path)), false);
});

test("sitemap.ts reads Sanity only through buildSitemapEntries and never stamps new Date()", async () => {
  const source = await read("src/app/sitemap.ts");
  assert.match(source, /buildSitemapEntries\(/);
  assert.doesNotMatch(source, /new Date\(/);
  assert.doesNotMatch(source, /\.(create|createOrReplace|patch|delete|mutate)\(/);
});

// ── llms.txt and manifest ───────────────────────────────────────────────────

test("llms.txt states only facts from company-identity and makes no unverifiable claims", async () => {
  const txt = await read("public/llms.txt");
  for (const fact of [COMPANY_IDENTITY.legalName, COMPANY_IDENTITY.number, COMPANY_IDENTITY.icoRegistrationNumber, COMPANY_IDENTITY.registeredJurisdiction, "115 City Road, Unit 1", "CF24 3BP", "info@hausofestate.com", "https://hausofestate.com/sitemap.xml"]) {
    assert.ok(txt.includes(fact), fact);
  }
  assert.doesNotMatch(txt, /\d[\d,]*\+|\d(\.\d)?\s?★|within \d+ hours?|years'? experience|rated|award/i);
  assert.doesNotMatch(txt, /Unit A/);
});

test("manifest description makes no unverifiable promise", async () => {
  const manifest = await read("src/app/manifest.ts");
  assert.doesNotMatch(manifest, /vetted|no hidden fees/i);
});

test("titles and descriptions on SEO-owned pages fit search-result limits", async () => {
  const pick = (body, key) => body.match(new RegExp(`${key}:\\s*\\n?\\s*'([^']+)'`))?.[1];
  const blog = await read("src/app/(main)/blog/page.tsx");
  const entries = [
    ["blog", blog.match(/BLOG_TITLE = '([^']+)'/)[1], blog.match(/BLOG_DESCRIPTION =\s*\n?\s*'([^']+)'/)[1]],
  ];
  for (const file of ["faq", "team"]) {
    const body = await read(`src/app/(main)/${file}/page.tsx`);
    entries.push([file, pick(body, "title"), pick(body, "description")]);
  }
  for (const [name, title, description] of entries) {
    assert.ok(title && description, `${name} metadata found`);
    assert.ok(title.length + " | Haus of Estate".length <= TITLE_MAX, `${name} title: ${title}`);
    assert.ok(description.length >= DESCRIPTION_MIN && description.length <= DESCRIPTION_MAX, `${name} description is ${description.length}`);
    assert.doesNotMatch(`${title} ${description}`, /within \d+ hours?|\d[\d,]*\+|years'? experience|no hidden fees|vetted/i, name);
  }
});
