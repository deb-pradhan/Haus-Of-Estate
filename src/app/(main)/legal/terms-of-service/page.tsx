import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_IDENTITY } from "@/lib/company-identity";
import { PRIVACY_CONTACT_EMAIL, FEE_DISCLOSURE_COPY } from "@/lib/site-claims";
import {
  LegalPage,
  LegalSection,
  LegalList,
  legalLinkClass,
} from "@/components/legal/legal-page";

/*
 * DRAFT for solicitor review.
 *
 * Rewritten 18 October 2026 against docs/mega-upgrade/audits/legal.md (P1-2).
 * Changes: removed the consumer indemnity, the "any failure to complete a
 * transaction" and "losses from investments" exclusions, deemed acceptance of
 * changes, and "investment advisory / recommendations" wording; role stated as
 * introducer; consumer jurisdiction made non-exclusive; statutory-rights line
 * added.
 * Still needed from the founder/solicitor: confirm Haus of Estate acts only as
 * an introducer in every market; whether a separate service agreement with a
 * written fee schedule is issued at instruction (Estate Agents Act 1979 s.18);
 * 14-day cancellation wording for any fee-paying service; redress scheme
 * details (see /legal/complaints, driven by company-identity.ts).
 */

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using the Haus of Estate website and our introduction service.",
  alternates: { canonical: "/legal/terms-of-service" },
};

const generalMail = (
  <a href={`mailto:${COMPANY_IDENTITY.generalEmail}`} className={legalLinkClass}>
    {COMPANY_IDENTITY.generalEmail}
  </a>
);

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" updated="18 October 2026">
      <LegalSection title="1. About these terms">
        <p>
          These terms apply when you use the {COMPANY_IDENTITY.name} website and our introduction
          service. {COMPANY_IDENTITY.name} is a trading name of {COMPANY_IDENTITY.legalName}{" "}
          (&quot;we&quot;, &quot;us&quot;). Please read them with our{" "}
          <Link href="/legal/privacy-policy" className={legalLinkClass}>
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/legal/cookie-policy" className={legalLinkClass}>
            Cookie Policy
          </Link>
          . If you use the website as a consumer, nothing in these terms affects your statutory
          rights.
        </p>
        <p>
          <strong>Company details:</strong> {COMPANY_IDENTITY.legalName}, registered in{" "}
          {COMPANY_IDENTITY.registeredJurisdiction}, company number {COMPANY_IDENTITY.number}.
          Registered office: {COMPANY_IDENTITY.registeredOffice}. Contact: {generalMail}.
        </p>
      </LegalSection>

      <LegalSection title="2. What we do, and what we do not">
        <p>
          We provide property market information and introductions. When you send us an enquiry we
          may introduce you to an estate agent, broker, developer or other provider in the market you
          are interested in.
        </p>
        <p>
          <strong>Our role.</strong> We act as an introducer. We are not your estate agent, mortgage
          broker, financial adviser, tax adviser or solicitor, and we are not a party to any
          purchase, sale or tenancy that follows an introduction. Agents, brokers and developers are
          separate legal entities. Your contract with them is with them, not with us, and they are
          responsible for their own advice, licences and conduct. If we ever act as an estate agent
          for you in the United Kingdom, we will give you our written terms of business, including
          our fee and when it is payable, before you are committed.
        </p>
        <p>
          We do not give legal, tax, financial or investment advice. Property values and rents can
          fall as well as rise, and overseas property carries extra risks. Take independent regulated
          advice before you commit.
        </p>
      </LegalSection>

      <LegalSection title="3. Fees and referral payments">
        <p>{FEE_DISCLOSURE_COPY}</p>
        <p>
          If we ever charge you a fee for a service, we will tell you the price and what you get
          before you agree to pay. If you buy a fee-paying service from us at a distance, you will
          have the right to cancel within 14 days in the way the Consumer Contracts Regulations 2013
          describe, and we will explain how before you pay.
        </p>
      </LegalSection>

      <LegalSection title="4. Using the website">
        <p>Please:</p>
        <LegalList>
          <li>give accurate information when you contact us and tell us if your details change;</li>
          <li>use the website only for genuine property enquiries and not for fraud, abuse or anything unlawful;</li>
          <li>not impersonate anyone, or try to disrupt or gain unauthorised access to the website;</li>
          <li>keep your account sign-in details to yourself.</li>
        </LegalList>
        <p>
          We may suspend or close an account, or stop replying to enquiries, if we reasonably believe
          these rules have been broken or the law requires it. Where the law requires, we may need to
          carry out identity and anti-money-laundering checks and cooperate with sanctions and
          regulatory obligations before an introduction proceeds.
        </p>
      </LegalSection>

      <LegalSection title="5. Property information">
        <p>
          We take care with the information shown on the website, but much of it comes from sellers,
          developers and agents. Prices are asking prices or indicative figures, and availability can
          change without notice. Images and plans may be illustrative or concept images. Please check
          details, ownership, legal standing and costs independently before you commit, and ask the
          agent for anything you need in writing. Links to other websites are provided for
          convenience and we are not responsible for their content.
        </p>
      </LegalSection>

      <LegalSection title="6. Marketing">
        <p>
          We send marketing only if you tick the optional marketing box on a form or otherwise ask us
          to. You can stop it at any time using the unsubscribe link or by emailing{" "}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={legalLinkClass}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          . Service replies to your enquiry are not marketing.
        </p>
      </LegalSection>

      <LegalSection title="7. Our responsibility to you">
        <p>
          We are responsible for loss or damage you suffer that is a foreseeable result of our
          breaking these terms or failing to use reasonable care and skill. We are not responsible
          for loss that was not foreseeable, for the acts, advice or failures of agents, brokers,
          developers or other third parties, or for a property transaction not completing for reasons
          outside our control. If you use our service for business purposes we do not accept
          liability for lost profit, revenue or business.
        </p>
        <p>
          Nothing in these terms excludes or limits our liability for death or personal injury caused
          by our negligence, for fraud or fraudulent misrepresentation, or for anything else that
          cannot lawfully be excluded or limited. Nothing in these terms affects your statutory
          rights as a consumer.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual property">
        <p>
          The website content, including text, graphics, logos and software, belongs to us or our
          licensors and is protected by copyright. You may view it and print it for your own use. You
          may not copy, distribute or adapt it for other purposes without our written permission.
        </p>
      </LegalSection>

      <LegalSection title="9. Closing your account">
        <p>
          You can ask us to close your account and delete your data at any time by emailing{" "}
          {generalMail}. We will deal with the request as our Privacy Policy describes.
        </p>
      </LegalSection>

      <LegalSection title="10. Complaints">
        <p>
          If something goes wrong, please tell us. Our process, timescales and what to do if you are
          still unhappy are on the{" "}
          <Link href="/legal/complaints" className={legalLinkClass}>
            complaints page
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to these terms">
        <p>
          We may update these terms, for example if the law or our service changes. We will show the
          new date at the top and, where we hold your email address and the change materially affects
          you, tell you before it applies. A change does not apply to an enquiry you made before it
          took effect.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law and courts">
        <p>
          These terms are governed by the law of England and Wales. If you are a consumer, you can
          bring a claim in the courts of the part of the United Kingdom where you live and, if you
          live elsewhere, in the courts of your home country where the law gives you that right.
          Nothing here removes any right you have under the mandatory consumer law of the country
          where you live. If you are not a consumer, the courts of England and Wales have
          non-exclusive jurisdiction.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          Email {generalMail}. Post: {COMPANY_IDENTITY.legalName}, {COMPANY_IDENTITY.registeredOffice}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
