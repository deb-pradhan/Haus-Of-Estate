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
 * Rewritten 18 October 2026 against docs/mega-upgrade/audits/legal.md (P0-4).
 * Facts the founder must confirm before this is treated as final:
 *  - each processor's data processing agreement and the region it uses
 *    (Railway, Sanity, Resend, Google, Meta/WhatsApp) and the transfer
 *    safeguard named in the recipients table;
 *  - that the privacy mailbox below exists and is monitored;
 *  - that enquiry records are actually reviewed and deleted on the stated
 *    schedule (no automated retention job exists in the codebase yet);
 *  - whether an EU Article 27 representative is needed for Cyprus/EU marketing;
 *  - the ICO/DUAA complaints-handling commencement position.
 */

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Haus of Estate collects, uses, shares and protects your personal data, and how to exercise your rights.",
  alternates: { canonical: "/legal/privacy-policy" },
};

const mail = (
  <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={legalLinkClass}>
    {PRIVACY_CONTACT_EMAIL}
  </a>
);

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="18 October 2026">
      <LegalSection title="1. Who we are">
        <p>
          {COMPANY_IDENTITY.name} is a trading name of {COMPANY_IDENTITY.legalName}{" "}
          (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). We are the controller of the personal data described in this
          policy. We introduce buyers, sellers, landlords, tenants and investors to estate agents,
          brokers and developers in the United Kingdom, the United Arab Emirates and selected
          international markets.
        </p>
        <p>
          {COMPANY_IDENTITY.legalName}, registered in {COMPANY_IDENTITY.registeredJurisdiction},
          company number {COMPANY_IDENTITY.number}. Registered office:{" "}
          {COMPANY_IDENTITY.registeredOffice}. ICO registration:{" "}
          <a
            href={COMPANY_IDENTITY.icoRegisterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={legalLinkClass}
          >
            {COMPANY_IDENTITY.icoRegistrationNumber}
          </a>
          .
        </p>
        <p>
          We have not appointed a Data Protection Officer. Our privacy contact is {mail}. We handle
          data in line with the UK GDPR and the Data Protection Act 2018, and the EU GDPR where it
          applies to you.
        </p>
      </LegalSection>

      <LegalSection title="2. What personal data we collect">
        <LegalList>
          <li>
            <strong>Enquiry details</strong> you give us in our forms: name, email address, mobile
            number, the market and area you are interested in, buy, rent, sell or let intent, property
            type, bedrooms, size, budget, timeline, and any notes you write.
          </li>
          <li>
            <strong>Account details</strong> if you register: name, email address and a hashed
            password, or your Google profile name and email if you sign in with Google.
          </li>
          <li>
            <strong>Messages</strong> you send us by email, phone or WhatsApp, including your phone
            number and the content of the conversation.
          </li>
          <li>
            <strong>Website usage data</strong>, only if you accept analytics cookies: pages visited,
            approximate location, device and browser type, and a random identifier. See our{" "}
            <Link href="/legal/cookie-policy" className={legalLinkClass}>
              Cookie Policy
            </Link>
            .
          </li>
          <li>
            <strong>Technical data</strong> that our hosting and security tools record when you
            visit, such as your IP address and request details.
          </li>
        </LegalList>
        <p>
          We do not ask you to upload passports, bank details or title deeds through this website. If
          an agent or we later need identity documents, for example for anti-money-laundering checks
          after you have chosen to proceed, we will ask separately and explain how to send them
          securely. We do not knowingly collect data about children.
        </p>
      </LegalSection>

      <LegalSection title="3. How and why we use your data">
        <LegalTable
          caption="Purposes and lawful bases"
          head={["Purpose", "Lawful basis (UK GDPR)"]}
          rows={[
            [
              "Reply to your enquiry and introduce you to a suitable agent, broker or developer",
              "Taking steps at your request before a contract (Art 6(1)(b)) and our legitimate interest in running our service (Art 6(1)(f))",
            ],
            ["Create and run your account", "Contract (Art 6(1)(b))"],
            [
              "Send property alerts and market updates by email, only if you ticked the optional box",
              "Consent (Art 6(1)(a)) and PECR. You can withdraw it at any time",
            ],
            [
              "Prioritise and route enquiries (see section 7)",
              "Legitimate interests (Art 6(1)(f))",
            ],
            [
              "Measure how the website is used, only if you accept analytics cookies",
              "Consent (PECR regulation 6 and Art 6(1)(a))",
            ],
            [
              "Keep the website secure and prevent fraud and abuse",
              "Legitimate interests (Art 6(1)(f))",
            ],
            [
              "Meet legal duties, such as anti-money-laundering checks where they apply to us, tax and company records",
              "Legal obligation (Art 6(1)(c))",
            ],
            [
              "Handle complaints and defend legal claims",
              "Legitimate interests (Art 6(1)(f)) and legal obligation",
            ],
          ]}
        />
        <p>
          Replying to your enquiry is not conditional on marketing. You can use our forms without
          opting in to marketing.
        </p>
      </LegalSection>

      <LegalSection title="4. Marketing">
        <p>
          We send marketing only if you tick the separate, optional marketing box on a form, or
          otherwise tell us you want it. Each form states the channel (currently email). Withdraw
          consent at any time by using the unsubscribe link or emailing {mail}. We keep a minimal
          record of your opt-out so that we honour it. We do not sell your data.
        </p>
      </LegalSection>

      <LegalSection title="5. Who receives your data">
        <p>
          <strong>Who receives your enquiry.</strong> We pass your enquiry to the licensed agent,
          developer or partner you ask us to introduce. They then act as a separate controller of the
          data you share with them and will have their own privacy notice. We do not control how they
          use it after the introduction.
        </p>
        <LegalTable
          caption="Service providers and recipients"
          head={["Recipient", "Purpose", "Where", "Safeguard"]}
          rows={[
            [
              "Railway",
              "Website hosting and database",
              "Provider is US-based; data may be processed outside the UK",
              "Provider data processing terms with international transfer safeguards (UK-US Data Bridge, or the UK Addendum to the EU Standard Contractual Clauses)",
            ],
            [
              "Sanity",
              "Content management for pages, articles and published testimonials",
              "Provider is US-based; data may be processed outside the UK",
              "As above",
            ],
            [
              "Resend",
              "Sending our emails, including enquiry notifications and account emails",
              "Provider is US-based; data may be processed outside the UK",
              "As above",
            ],
            [
              "Google (Analytics 4, Tag Manager, Sign-in)",
              "Website analytics, only after you accept analytics cookies; Google sign-in if you choose it",
              "Provider is US-based; data may be processed outside the UK",
              "As above. Google Signals and ad personalisation are switched off",
            ],
            [
              "WhatsApp (Meta)",
              "Messages you send us through WhatsApp or the click-to-chat button",
              "Provider is US-based; data may be processed outside the UK",
              "Governed by WhatsApp's own terms and privacy policy once you start a chat",
            ],
            [
              "Agents, brokers and developers you ask us to introduce",
              "Dealing with your enquiry, viewings and transaction",
              "In the country of the property, for example the United Kingdom, the United Arab Emirates or Indonesia",
              "See section 6",
            ],
            [
              "Professional advisers, regulators and law enforcement",
              "Legal advice, and meeting legal duties such as tax or anti-money-laundering reporting",
              "United Kingdom, and elsewhere where the law requires",
              "Disclosed only where required or permitted by law",
            ],
          ]}
        />
        <p>
          If we sell or restructure the business, your data may pass to the new owner, who must
          continue to protect it.
        </p>
      </LegalSection>

      <LegalSection title="6. International transfers">
        <p>
          Where an agent you ask us to introduce is in the United Arab Emirates, your data is
          transferred to a country without a UK adequacy decision. We use the ICO International Data
          Transfer Agreement or the UK Addendum to the EU Standard Contractual Clauses, and assess the
          risks first. The same approach applies to other countries without an adequacy decision, such
          as Indonesia. Cyprus and other EU countries benefit from UK adequacy regulations. You can
          ask us for a copy of these safeguards by emailing {mail}.
        </p>
        <p>
          Our US-based service providers are listed in section 5. If you choose to contact an agent
          directly or through WhatsApp, that exchange is between you and them.
        </p>
      </LegalSection>

      <LegalSection title="7. Scoring enquiries (profiling)">
        <p>
          We score enquiries to prioritise follow-up, for example by the type of enquiry and how
          urgent it is, and assign each a tier and a routing team. The score is used internally by our
          team. No decision with a legal or similarly significant effect on you is made solely by
          automated means. You can ask us to review how your enquiry was handled, and you can object
          at any time.
        </p>
      </LegalSection>

      <LegalSection title="8. How long we keep your data">
        <LegalTable
          caption="Retention periods"
          head={["Record", "How long"]}
          rows={[
            [
              "Enquiry records",
              "Up to 3 years after our last contact with you, then deleted or anonymised",
            ],
            [
              "Marketing preferences",
              "Until you withdraw consent or after 2 years of inactivity. We keep a minimal opt-out record so that we honour it",
            ],
            [
              "Account data",
              "While your account is open. Ask us to close it and we will delete it, unless the law requires us to keep something",
            ],
            [
              "Anti-money-laundering records, where those rules apply to us",
              "Five years after the end of the relationship or the transaction",
            ],
            [
              "Accounting and tax records",
              "Up to six years, to meet tax and company law",
            ],
            [
              "Analytics data",
              "For the retention period set in our Google Analytics account, which cannot exceed 14 months",
            ],
            [
              "Complaint records",
              "Up to 6 years after the complaint is closed",
            ],
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Your rights">
        <p>You have the right to:</p>
        <LegalList>
          <li>be told what data we hold about you and get a copy (subject access)</li>
          <li>have inaccurate data corrected</li>
          <li>have your data erased, where we have no good reason to keep it</li>
          <li>restrict how we use your data in some circumstances</li>
          <li>receive your data in a portable format, where the basis is consent or contract</li>
          <li>object to processing based on legitimate interests, and to direct marketing at any time</li>
          <li>withdraw consent at any time, without affecting earlier processing</li>
        </LegalList>
        <p>
          Email {mail}. We may ask you to confirm your identity first. We will respond without undue
          delay and within one month, and tell you if we need longer for a complex request.
        </p>
      </LegalSection>

      <LegalSection title="10. Complaints">
        <p>
          If you are unhappy with how we have handled your data, please tell us first at {mail}. We
          will acknowledge your complaint within 30 days and tell you the outcome without undue
          delay. You can also complain to the Information Commissioner&apos;s Office at{" "}
          <a
            href="https://ico.org.uk/make-a-complaint/"
            target="_blank"
            rel="noopener noreferrer"
            className={legalLinkClass}
          >
            ico.org.uk/make-a-complaint
          </a>{" "}
          (helpline 0303 123 1113). If you are in the EU, you can complain to your local data
          protection authority. For complaints about our service rather than your data, see{" "}
          <Link href="/legal/complaints" className={legalLinkClass}>
            how to make a complaint
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Cookies">
        <p>
          We use strictly necessary cookies to run sign-in and security. We use analytics cookies
          only if you accept them. See our{" "}
          <Link href="/legal/cookie-policy" className={legalLinkClass}>
            Cookie Policy
          </Link>{" "}
          for the full list and how to change your choice.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to this policy">
        <p>
          We will update this policy when our practices or the law change and show the date at the
          top. Version history:
        </p>
        <LegalList>
          <li>18 October 2026: rewritten to name recipients and transfer safeguards, separate service contact from marketing, disclose scoring, and restate retention.</li>
          <li>25 September 2026: previous version.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="13. Contact us">
        <p>
          Privacy contact: {mail}. Post: {COMPANY_IDENTITY.legalName}, {COMPANY_IDENTITY.registeredOffice}.
        </p>
      </LegalSection>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-2 font-serif text-lg font-medium text-estate-700">
          Need help with a data request?
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Email us to ask for a copy of your data, a correction or deletion. We will respond without
          undue delay and within one month.
        </p>
        <Button asChild className="bg-estate-700 text-white hover:bg-estate-600">
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>Email our privacy contact</a>
        </Button>
      </div>
    </LegalPage>
  );
}
