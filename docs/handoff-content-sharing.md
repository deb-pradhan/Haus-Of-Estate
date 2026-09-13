# Haus of Estate content-sharing handoff

Updated: 31 August 2026

## Branch safety

- Branch: `suryak02/content-sharing`
- Base: latest `origin/main` at branch creation (`4b953091`)
- This branch contains no lead-intake qualifier or purchase-readiness changes.
- It must be reviewed and squash-merged independently. Never push or merge it
  directly into `main` outside the PR review process.

## What changed

- Replaced the blog-only share implementation with one reusable
  `ContentShare` component for articles and property detail pages.
- Uses the native device share sheet when supported and calls it directly from
  the user gesture.
- Treats native cancellation as a normal dismissal. Unsupported or failed
  native sharing opens a keyboard-accessible fallback.
- Fallback actions include Copy Link, WhatsApp, email, Facebook, LinkedIn, X,
  and Pinterest.
- Every shared link is rebuilt from the canonical
  `https://hausofestate.com` origin with query strings and fragments removed.
  No short-link service, redirect route, tracking parameter, or database model
  was introduced.
- Clipboard success is announced. Clipboard failure reveals a selectable full
  canonical URL for manual copying.
- Property pages show a compact action below the title/location on mobile and
  repeat it in the desktop enquiry aside.
- Articles show a compact action below the metadata up to the XL breakpoint and
  an accessible sticky share rail on wider screens. The old nested sidebar
  share card was removed.
- All icon targets are at least 44 by 44 CSS pixels.

## Verification

- 3 Vitest canonical-URL and intent-link tests pass.
- 7 Playwright desktop/mobile tests pass, covering native share, cancellation,
  fallback, copy success/failure, canonical URLs, keyboard dismissal, focus
  return, 44px targets, placement, and mobile overflow.
- Targeted ESLint and TypeScript pass.
- The production build passes.
- Desktop article and mobile property screenshots were visually inspected; the
  share UI is visible without covering content or creating horizontal overflow.

## Follow-up

Branded `/s/...` links remain deliberately deferred. Full canonical links are
durable, produce the site’s existing Open Graph previews, and require no new
redirect security or retention surface.
