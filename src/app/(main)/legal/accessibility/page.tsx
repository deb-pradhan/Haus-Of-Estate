import type { Metadata } from "next";
import { COMPANY_IDENTITY, getAccessibilityEmail } from "@/lib/company-identity";
import { LegalList, LegalPage, LegalSection, legalLinkClass } from "@/components/legal/legal-page";

/*
 * Accessibility statement. It claims no audit result: it says what the site
 * aims for, what has not been independently checked, and how to report a
 * barrier. Feedback goes to the general company email until a dedicated
 * address is set in lib/company-identity.ts.
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
    <LegalPage title="Accessibility statement" updated="10 November 2026">
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
          <li>scrolling and moving content, which respects your device&apos;s reduced-motion setting;</li>
          <li>floor plans and brochures, which are images or PDF files without a full text equivalent;</li>
          <li>third-party content such as embedded videos, which we do not control.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Tell us about a barrier">
        <p>
          If you find something hard to use, or you need information in another format, email{" "}
          <a href={`mailto:${email}`} className={legalLinkClass}>
            {email}
          </a>
          . Tell us the page, what you were trying to do, and the device or assistive technology you
          use. We will reply as soon as we can and tell you what we can do.
        </p>
      </LegalSection>

      <LegalSection title="If you are not satisfied">
        <p>
          Reply to our response and ask for it to be reviewed. In Great Britain you can also contact
          the Equality Advisory and Support Service (equalityadvisoryservice.com).
        </p>
      </LegalSection>

      <LegalSection title="This statement">
        <p>
          Prepared on 10 November 2026. We will review it when we make significant changes to the
          website and after any accessibility audit.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
