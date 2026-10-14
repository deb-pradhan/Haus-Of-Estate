# Blog artwork correction - 8 September 2026

## What was still wrong

The first thumbnail fix removed image cropping in grid and related cards, but
category badges and saved-article buttons still covered words embedded in the
artwork. The featured article still used a crop frame, hover zoom, gradients and
overlaid title text. The earlier claim that the issue was fully fixed was too broad.

## Correction

- Grid category labels and bookmarks now occupy their own row above the image.
- Featured artwork uses an uncropped 16:9 frame with contain fitting, no image
  zoom or gradients; title, summary and author information appear below it.
- The featured category and bookmark also have a separate row above the image.
- Existing article links, saved-content flags and bookmark behavior are preserved.
- Author portraits are unchanged; compact related thumbnails retain contain fitting.

## Review and preview

- Image fitting and category layout belong to `suryak02/blog-thumbnail-fit`, draft
  PR #13: https://github.com/deb-pradhan/Haus-Of-Estate/pull/13.
- Bookmark placement belongs to `suryak02/saved-content`, draft PR #7. Keep its
  controls outside article links and off the artwork when merging these branches.
- The combined implementation is on `suryak02/product-demo-integration` and
  visible at http://localhost:3110/blog. Production is not changed by localhost.
- Never push or merge directly to `main`.

## Verification

- Targeted ESLint passed for both changed components in the integration preview.
- Browser screenshots checked real Sanity artwork at 1435px desktop and 390px
  mobile; the featured layout was also checked at 1280px.
- All nine rendered cards reported contain fitting, loaded images, no image zoom
  and bookmark controls outside the image rectangles in the desktop check.
- The mobile Disney bookmark toggled successfully without navigating away.
- No horizontal page overflow appeared at the tested widths.
- No full production build or Lighthouse run was repeated for this layout-only fix.

## Suggested update to Sonia

I found that labels and save buttons were still covering parts of the blog
artwork, in addition to the image cropping. Both are corrected in the local
preview now, including the featured article. The change is on review branches;
Deb still needs to review and deploy it before the public website changes.
