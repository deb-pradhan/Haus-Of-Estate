# Developer partner carousel — 25 September 2026

The homepage's six text-only names are now an accessible, manually controlled
carousel containing their original logos, plus Azizi, Imtiaz and Ellington from
Sonia's [Website Property Inventory](https://docs.google.com/spreadsheets/d/1xJn-sMduVD04VVa2sCEfIhc95_5_oOq5Vah00fGlK6Y/edit).
The sheet evidence is recorded in `backlog-reconciliation-2026-09-17.md` (A6:A8).
Elounda Hills is included following Surya's explicit confirmation of that
partnership. Developer names do not create property listings or imply available stock.

## Original artwork sources

| Local file under `public/partners` | Source inspected on 25 September |
| --- | --- |
| `emaar.svg` | [Emaar original SVG](https://www.emaar.com/images/emaar-logo.svg), referenced by its official site |
| `damac.png` | [DAMAC original Contentful image](https://images.ctfassets.net/zoq5l15g49wj/3lLGhTgmvt67TI80F2Pirf/817e034874fbe8a01f8e8cd1158ebaf8/DAMAC_EN_-_BLACK.png), found in the DAMAC Properties website header on its [publicly indexed Amplify preview](https://preprod.dgruoce79a3w9.amplifyapp.com/en/); the main site returned HTTP 403. Same Contentful space appears on [DAMAC Group](https://www.damacgroup.com/en/) |
| `nakheel.svg` | [Nakheel header logo](https://www.nakheel.com/images/nakheelcorporatelibraries/logos/nakheel-log.svg?sfvrsn=f5c04a69_1) |
| `sobha.svg` | [Sobha Realty footer logo](https://sobharealty.com/themes/sobha_uplift/images/footer-logo-v2.svg) |
| `meraas.svg` | Exact inline header SVG from [Meraas](https://meraas.com/en), identified by its `meraasLogo` wrapper |
| `dubai.svg` | [Dubai Properties header logo](https://www.dp.ae/pictures/images/new-logo-en.svg) |
| `azizi.png` | Exact logo-only raster extraction from physical page 139 of the supplied official `C:\Users\surya\Downloads\Brochure\Brochure\Florence Brochure.pdf`; source SHA-256 `bc9c83b41c6ca197dfd0856bf237a158f7a60b06e19ff820c6352314c726bdcc` |
| `imtiaz.svg` | [Imtiaz header logo](https://imtiaz.ae/layout/image/logo-red.svg) |
| `ellington.png` | [Ellington original image](https://cf90163a.delivery.rocketcdn.me/wp-content/uploads/Ellington-Logo_Black-2.png), used by [Ellington Properties](https://ellingtonproperties.ae/) |
| `elounda.svg` | [Elounda Hills original SVG](https://eloundahills.gr/wp-content/uploads/2022/12/logo-gold.svg), used by [Elounda Hills](https://eloundahills.gr/) |

No logos were recreated or recoloured. Nakheel's source incorrectly declared
UTF-16 while supplying UTF-8 bytes; only that XML declaration was corrected.
Meraas's SVG was extracted intact from its page. Azizi's logo was extracted with
Poppler from page 139 at a 5600-pixel long edge, region x=1640, y=2680,
width=830, height=235. The rest of its brochure is not distributed. Other image
files retain their downloaded bytes. All ten assets total approximately 55 KB.
White Nakheel and Dubai Properties originals sit on dark green panels for contrast.

## Interaction and checks

- Native horizontal scrolling and scroll snapping; two cards on narrow screens,
  three at intermediate sizes, five on desktop.
- Labelled previous/next buttons, disabled at the ends; focusable list supports
  Left/Right and Home/End. Every logo has its partner name as alternative text.
- No autoplay or duplicate slides. Reduced-motion users get immediate scrolling.
- Original colours and proportions are preserved with `object-contain`.
- Parent task browser checks confirmed desktop and mobile arrow navigation,
  keyboard End, all ten logos, and disabled Next at the end.
- Asset inspection confirmed valid decodable images; source SVGs contain no
  scripts, event handlers or external embedded references.

This prepares Release 2 only. No production deployment or CMS changes occurred.
