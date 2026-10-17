import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { COMPANY_IDENTITY } from "@/lib/company-identity";
import { PRIVACY_CONTACT_EMAIL } from "@/lib/site-claims";
import {
  LegalPage,
  LegalSection,
  LegalList,
  LegalTable,
  legalLinkClass,
} from "@/components/legal/legal-page";

/*
 * DRAFT for solicitor review.
 *
 * Rewritten 18 October 2026 to match what the code actually sets
 * (legal.md P1-1): Auth.js strictly necessary cookies, GA4 `_ga` and
 * `_ga_<ID>` only after opt-in, and the `haus.analytics-consent.v1` local
 * storage key. Removed cookies and services that do not exist in the code:
 * Intercom, Calendly, NEXT_LOCALE, _gid, _gat and Google Fonts (fonts are
 * self-hosted by next/font).
 * FOUNDER: if the live GTM container fires any other tag (Ads, remarketing,
 * heatmaps), this page and the banner must be updated before launch.
 */

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "The cookies and similar technologies Haus of Estate uses, why, and how to change your choice.",
  alternates: { canonical: "/legal/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="18 October 2026">
      <LegalSection title="1. What cookies are">
        <p>
          Cookies are small text files stored on your device when you visit a website. Similar
          technologies, such as local storage, work in the same way. This policy explains what{" "}
          {COMPANY_IDENTITY.name} ({COMPANY_IDENTITY.legalName}) uses, in line with the Privacy and
          Electronic Communications Regulations (PECR) and the UK GDPR.
        </p>
      </LegalSection>

      <LegalSection title="2. What we use, in plain terms">
        <p>We use two kinds of storage and nothing else:</p>
        <LegalList>
          <li>
            <strong>Strictly necessary:</strong> sign-in and security. These do not need your consent
            because the site cannot work without them.
          </li>
          <li>
            <strong>Analytics, only if you accept:</strong> Google Analytics 4 measures visits and
            clicks on public pages. It does not load until you choose &quot;Accept analytics&quot;.
          </li>
        </LegalList>
        <p>
          We do not use advertising or remarketing cookies. Google Signals and ad personalisation are
          switched off, and accepting analytics does not turn them on.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookies and storage in detail">
        <LegalTable
          caption="Cookies and local storage used by this website"
          head={["Name", "Provider", "Purpose", "Duration", "Consent needed"]}
          rows={[
            [
              <code key="a">authjs.session-token</code>,
              "Haus of Estate (Auth.js)",
              "Keeps you signed in, if you have an account",
              "Up to the end of your session or sign-in period",
              "No, strictly necessary",
            ],
            [
              <code key="b">authjs.csrf-token</code>,
              "Haus of Estate (Auth.js)",
              "Protects sign-in forms against forgery",
              "Session",
              "No, strictly necessary",
            ],
            [
              <code key="c">authjs.callback-url</code>,
              "Haus of Estate (Auth.js)",
              "Remembers the page to return to after sign-in",
              "Session",
              "No, strictly necessary",
            ],
            [
              <code key="d">haus.analytics-consent.v1</code>,
              "Haus of Estate (local storage)",
              "Records your analytics choice so we can respect it next time",
              "Up to 180 days, then we ask again",
              "No, strictly necessary to honour your choice",
            ],
            [
              <code key="e">_ga</code>,
              "Google Analytics 4",
              "Distinguishes visitors so visits can be counted",
              "Up to 2 years",
              "Yes, set only after you accept analytics",
            ],
            [
              <code key="f">{"_ga_<measurement ID>"}</code>,
              "Google Analytics 4",
              "Keeps session state for analytics",
              "Up to 2 years",
              "Yes, set only after you accept analytics",
            ],
          ]}
        />
        <p>
          On the live site, Auth.js cookie names carry a <code>__Secure-</code> or{" "}
          <code>__Host-</code> prefix. Analytics events exclude search text, form answers, email
          addresses, query strings and full referrers.
        </p>
      </LegalSection>

      <LegalSection title="4. Videos and other third-party content">
        <p>
          Video walkthroughs on property pages (YouTube or Vimeo) load only when you press play.
          Until then nothing is requested from the video provider. YouTube videos play from the
          privacy-enhanced youtube-nocookie.com domain. Once you press play, the provider may set
          cookies and collects data under its own policy.
        </p>
        <p>
          If you follow a link to WhatsApp or one of our social media pages, that service is governed
          by its own cookie and privacy policies.
        </p>
      </LegalSection>

      <LegalSection title="5. Your choices">
        <LegalList>
          <li>
            Use <strong>Cookie Settings</strong> in the footer of any page to accept or reject
            analytics at any time. Withdrawing consent removes the Google Analytics cookies we can
            reach and stops analytics scripts loading.
          </li>
          <li>
            Rejecting analytics does not stop any feature working. Strictly necessary storage stays
            in place.
          </li>
          <li>
            You can also block or delete cookies in your browser settings, or install the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className={legalLinkClass}
            >
              Google Analytics Opt-out Browser Add-on
            </a>
            . Blocking strictly necessary cookies may stop sign-in working.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="6. Changes to this policy">
        <p>
          We will update this policy if what we use changes, and show the date at the top. Related:
          our{" "}
          <Link href="/legal/privacy-policy" className={legalLinkClass}>
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Contact">
        <p>
          Questions about cookies: email{" "}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={legalLinkClass}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          . Post: {COMPANY_IDENTITY.legalName}, {COMPANY_IDENTITY.registeredOffice}.
        </p>
      </LegalSection>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-2 font-serif text-lg font-medium text-estate-700">
          Want to change your cookie choice?
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Use Cookie Settings in the footer of any page, or email us to ask about data we hold.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-estate-700 text-white hover:bg-estate-600">
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>Email our privacy contact</a>
          </Button>
          <Button variant="outline" asChild className="border-estate-700 text-estate-700">
            <Link href="/">Return to home</Link>
          </Button>
        </div>
      </div>
    </LegalPage>
  );
}
