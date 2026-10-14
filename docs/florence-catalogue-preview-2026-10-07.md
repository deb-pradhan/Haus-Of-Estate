# Catalogue to Florence: local review

The 3017 preview server was stopped on 7 October, causing `ERR_CONNECTION_REFUSED`. It was restarted from the existing Release 2 integration worktree; the separate London server on 3018 was preserved.

## Click-through

1. Open `http://127.0.0.1:3017/properties`.
2. Under **Community previews**, choose **Azizi Florence — Explore community and home designs**. One community card shows the supplied starting prices for the matching villa/townhouse collections; it is separate from published listings.
3. The existing `/dev/property-previews` page shows the large Florence overview, then **Villas** and **Townhouses**.
4. Choose a bedroom collection, then a design. Its matching images, plot/built-up areas and floor plans remain in the existing shared property detail presentation. Sonia's terminology clarification of 7 October changes the displayed "sellable area" label to "Built-up area" without changing the figures. Flagged brochure-area discrepancies remain visible; brochure requests and enquiries remain disabled.

The catalogue's existing location selector includes **United Arab Emirates → Sharjah** in this local mode. Geography is derived from the verified prepared bundle using the existing location grouping. Type, bedroom, text and source-currency budget filters apply to the home collections. Explicit rental or availability filters do not invent missing availability. A sales browsing context may show an editorial collection; it does not assert that individual units are available.

## Scope and isolation

This is a local journey preview, not publication. Both `NODE_ENV=development` and `HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW=true` are required. Production ignores the flag and continues to use the existing Sanity catalogue. The local catalogue is noindex/nofollow; preview location responses are private/no-store. The ordinary public query, publication rules and Sanity records are unchanged. Local preview disables lead intake, assistant, saving and Sanity Live subscriptions; local source data needs no Sanity browser/CORS access.

Florence source: `C:/Users/surya/Downloads/Haus-Florence-variants-prepared-2026-10-04`. Originals and prepared media remain outside Git. This mode consumes the existing overview, five collections and 19 design variants; it creates no additional property records. The London-only bundle does not produce a Florence card.

The final production catalogue grouping and approved content publication remain separate release work. Do not assume deploying the branch will publish Florence or enable this local mode.

## Restart locally

From the existing Release 2 checkout/worktree with installed dependencies, run in PowerShell:

```powershell
$env:HAUS_PROPERTY_PREVIEW_DIR='C:/Users/surya/Downloads/Haus-Florence-variants-prepared-2026-10-04'
$env:HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW='true'
$env:HAUS_NEXT_DIST_DIR='.next-florence-preview'
$env:AUTH_ENABLED='false'
$env:SAVED_CONTENT_ENABLED='false'
$env:PROPERTY_ASSISTANT_ENABLED='false'
$env:LEAD_INTAKE_ENABLED='false'
$env:CAREERS_INTAKE_ENABLED='false'
$env:NEXT_PUBLIC_GTM_ID=''
$env:NEXT_PUBLIC_GA4_ID=''
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3017
```

Keep this process running while reviewing; a stopped process cannot serve the localhost link. The current background server writes logs to `C:/Users/surya/Downloads/Haus-Florence-preview-runtime` and has its own build directory. Do not stop the separate London process or overwrite its bundle to restart Florence.

## Verification

- Full Vitest suite: 75 files, **593 tests passed**, including development/production gating, unchanged ordinary catalogue behavior, source facts, search filters, location response caching and local shell isolation.
- TypeScript, scoped ESLint and all nine SEO/analytics checks passed. Preview render, helper and API tests preserve existing Florence/London behavior.
- Browser: `/properties` rendered the draft community alongside the two published Sanity listings. Selecting UAE then Sharjah retained one Florence community preview and correctly separated the zero published results. Clicking through the community, three-bedroom townhouse collection, Tasso middle design and ground-floor plan succeeded; the plan opened as a 2560 × 1811 image. Backlinks returned to the catalogue.
- Desktop/mobile catalogue layout reviewed with no horizontal overflow; noindex/nofollow observed. Enquiry/brochure controls remained disabled. Mobile viewport override reset after review.
- No full production build or production publication was performed for this development-only addition. The public Sanity content and customer messaging configuration were not changed.
