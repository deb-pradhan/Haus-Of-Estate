import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_IDENTITY, getAccessibilityEmail } from "@/lib/company-identity";
import { RESPONSE_TIME_COPY } from "@/lib/site-claims";
import {
  LegalPage,
  LegalSection,
  LegalList,
  legalLinkClass,
} from "@/components/legal/legal-page";

/*
 * Accessibility statement (legal.md P2-1 / roadmap T-13). Contact falls back
 * to the general company email until `accessibilityContactEmail` is set in
 * lib/company-identity.ts. No audit result is claimed: the page says the site
 * has not yet had a full independent audit.
 */

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Our commitment to making the Haus of Estate website usable by everyone, and how to tell us about a problem.",
  alternates: { canonical: "/legal/accessibility" },
};

export default function AccessibilityPage() {
  const email = getAccessibilityEmail();

  return (
    <LegalPage title="Accessibility statement" updated="18 October 2026">
      <LegalSection title="Our commitment">
        <p>
          {COMPANY_IDENTITY.name} wants everyone to be able to use this website. We aim to meet the
          Web Content Accessibility Guidelines (WCAG) 2.2 at level AA, and we design for keyboard
          use, screen readers, readable text sizes and sufficient colour contrast.
        </p>
      </LegalSection>

      <LegalSection title="Where we are now">
        <p>
          We have not yet completed a full independent accessibility audit, so we cannot say the site
          fully meets WCAG 2.2 AA. We check our own pages as we build them and fix problems we find.
          Areas we know need continued attention:
        </p>
        <LegalList>
          <li>multi-step enquiry forms, including keyboard order and error messages;</li>
          <li>colour contrast on some text over images and coloured backgrounds;</li>
          <li>scrolling and moving content, which you can pause, and which respects your device&apos;s reduced-motion setting;</li>
          <li>third-party content such as embedded maps and videos, which we do not control.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Tell us about a barrier">
        <p>
          If you find something hard to use, or you need information in another format, email{" "}
          <a href={`mailto:${email}`} className={legalLinkClass}>
            {email}
          </a>
          . Tell us the page, what you were trying to do, and the device or assistive technology you
          use. We will reply {RESPONSE_TIME_COPY} and tell you what we can do.
        </p>
      </LegalSection>

      <LegalSection title="If you are not satisfied">
        <p>
          You can follow our{" "}
          <Link href="/legal/complaints" className={legalLinkClass}>
            complaints process
          </Link>
          . In Great Britain you can also contact the Equality Advisory and Support Service
          (equalityadvisoryservice.com).
        </p>
      </LegalSection>

      <LegalSection title="This statement">
        <p>
          Prepared on 18 October 2026. We will review it when we make significant changes to the
          website and after any accessibility audit.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
