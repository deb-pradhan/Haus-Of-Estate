import type { Metadata } from "next";
import Link from "next/link";
import {
  COMPANY_IDENTITY,
  getComplaintsEmail,
  getRegulatoryLines,
} from "@/lib/company-identity";
import {
  COMPLAINT_FINAL_RESPONSE_WEEKS,
  PRIVACY_CONTACT_EMAIL,
} from "@/lib/site-claims";
import {
  LegalPage,
  LegalSection,
  LegalList,
  legalLinkClass,
} from "@/components/legal/legal-page";

/*
 * DRAFT for solicitor review.
 *
 * Complaints procedure (legal.md P0-6). The redress scheme paragraph renders
 * only when `redressScheme` is set in lib/company-identity.ts, so no scheme is
 * claimed until the founder supplies the name and membership number. Timescale
 * for the final response is COMPLAINT_FINAL_RESPONSE_WEEKS in lib/site-claims.ts.
 */

export const metadata: Metadata = {
  title: "Complaints",
  description:
    "How to make a complaint to Haus of Estate, what happens next, and what to do if you are still unhappy.",
  alternates: { canonical: "/legal/complaints" },
};

export default function ComplaintsPage() {
  const email = getComplaintsEmail();
  const scheme = COMPANY_IDENTITY.redressScheme.trim();
  const membership = COMPANY_IDENTITY.redressMembershipNo.trim();
  const lines = getRegulatoryLines();

  return (
    <LegalPage title="Complaints" updated="18 October 2026">
      <LegalSection title="Our promise">
        <p>
          We want to put things right if we get something wrong. This page explains how to complain,
          what we will do, and where you can go if you are still unhappy. Complaints are free to make
          and will not affect how we treat you.
        </p>
      </LegalSection>

      <LegalSection title="Stage 1: tell us">
        <p>
          Email{" "}
          <a href={`mailto:${email}`} className={legalLinkClass}>
            {email}
          </a>{" "}
          or write to {COMPANY_IDENTITY.legalName}, {COMPANY_IDENTITY.registeredOffice}. Please give:
        </p>
        <LegalList>
          <li>your name and the contact details you used with us;</li>
          <li>what happened, when, and who you dealt with if you know;</li>
          <li>what you would like us to do about it.</li>
        </LegalList>
        <p>
          If your complaint is about an agent, broker or developer we introduced you to, tell them
          too. They are a separate business and are responsible for their own service, but we want
          to know if an introduction went wrong.
        </p>
      </LegalSection>

      <LegalSection title="Stage 2: we look into it">
        <p>
          We will acknowledge your complaint as soon as we can, tell you who is handling it, and
          investigate it fairly. Someone who was not involved in the original matter will review it
          where we can. We will keep you updated if it takes longer than expected.
        </p>
      </LegalSection>

      <LegalSection title="Stage 3: our final response">
        <p>
          We will send you a written <strong>final response</strong> setting out what we found, what
          we will do, and what you can do next. We will send it no later than{" "}
          {COMPLAINT_FINAL_RESPONSE_WEEKS} weeks after you first complained.
        </p>
      </LegalSection>

      <LegalSection title="If you are still unhappy">
        {scheme ? (
          <p>
            We are a member of {scheme}
            {membership ? `, membership number ${membership}` : ""}. If you are not satisfied with our
            final response, or we have not sent one within {COMPLAINT_FINAL_RESPONSE_WEEKS} weeks,
            you can ask the scheme to look at your complaint. Its decision is free to you. Ask us
            for the scheme&apos;s contact details if you cannot find them.
          </p>
        ) : (
          <p>
            If you remain unhappy after our final response, you may wish to take independent advice,
            for example from Citizens Advice, or from a solicitor. You can also take legal action.
            Your statutory rights are not affected by using this process.
          </p>
        )}
        <p>
          Complaints about how we handle your personal data can also go to the Information
          Commissioner&apos;s Office. See our{" "}
          <Link href="/legal/privacy-policy" className={legalLinkClass}>
            Privacy Policy
          </Link>{" "}
          or email{" "}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={legalLinkClass}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      {lines.length > 0 && (
        <LegalSection title="Regulation">
          <LegalList>
            {lines.map((line) => (
              <li key={line.label}>
                <strong>{line.label}:</strong> {line.value}
              </li>
            ))}
          </LegalList>
        </LegalSection>
      )}
    </LegalPage>
  );
}
