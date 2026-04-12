import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-3">
            <Image src="/Frame 16-1.svg" alt="Haus of Estate" width={100} height={54} className="h-6 w-auto" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
        <div className="mb-8">
          <p className="font-serif text-sm font-medium uppercase tracking-widest text-gold-500 mb-2">Legal</p>
          <h1 className="font-serif text-4xl font-medium text-estate-700">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">1. Who We Are</h2>
            <p>
              Haus of Estate ("we", "our", "us") is an international real estate advisory firm operating across the United Kingdom, United Arab Emirates, and Indonesia. We are committed to protecting your personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and the EU General Data Protection Regulation (GDPR) where applicable.
            </p>
            <p className="mt-2">
              <strong>Company details:</strong><br />
              Haus of Estate Ltd<br />
              Registered in England and Wales<br />
              Company number: [To be confirmed]<br />
              Registered address: [To be confirmed]<br />
              Email:{" "}
              <a href="mailto:privacy@hausofestate.com" className="text-trust-teal hover:underline">
                privacy@hausofestate.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">2. What Personal Data We Collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Identity data:</strong> first name, surname, passport number (for property transactions)</li>
              <li><strong>Contact data:</strong> email address, mobile number, postal address</li>
              <li><strong>Financial data:</strong> bank details (only where required for transactions), budget range, investment preferences</li>
              <li><strong>Property data:</strong> property requirements, location preferences, bedrooms, size, urgency indicators, title deed documents</li>
              <li><strong>Usage data:</strong> how you interact with our website, including pages visited and time spent</li>
              <li><strong>Marketing preferences:</strong> your consent to receive marketing communications via WhatsApp, SMS, email, and phone</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">3. How We Use Your Data</h2>
            <p>We use your personal data for the following purposes:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>To respond to your property enquiries and provide personalised property recommendations</li>
              <li>To match you with properties based on your stated requirements (buy/rent/invest)</li>
              <li>To list your property for sale or rent and facilitate transactions</li>
              <li>To send you market insights, investment guides, and property opportunities where you have given consent</li>
              <li>To comply with our legal obligations under UK and EU anti-money laundering regulations</li>
              <li>To improve our website and services through analytics</li>
            </ul>
            <p className="mt-3">
              <strong>Legal basis for processing:</strong> We rely on <strong>consent</strong> (Article 6(1)(a) UK GDPR) for marketing communications, <strong>contractual necessity</strong> (Article 6(1)(b)) for property services, and <strong>legitimate interests</strong> (Article 6(1)(f)) for fraud prevention and service improvement.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">4. Marketing Communications</h2>
            <p>
              Where you have provided explicit consent, we may contact you via:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>WhatsApp:</strong> Property matches, market updates, investment opportunities</li>
              <li><strong>SMS:</strong> Property alerts and viewing confirmations</li>
              <li><strong>Email:</strong> Newsletter, property shortlists, market reports</li>
              <li><strong>Phone:</strong> Agent consultations and follow-up calls</li>
            </ul>
            <p className="mt-3">
              Under UK and EU law ( PECR 2003 and GDPR), we require your <strong>explicit opt-in consent</strong> before sending marketing messages. You have the right to withdraw this consent at any time by contacting us at{" "}
              <a href="mailto:privacy@hausofestate.com" className="text-trust-teal hover:underline">
                privacy@hausofestate.com
              </a>{" "}
              or clicking the unsubscribe link in any marketing email.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">5. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share your data with:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Property developers</strong> (Emaar, Damac, etc.) where you have expressed interest in specific projects</li>
              <li><strong>Legal representatives</strong> and conveyancing agents to complete property transactions</li>
              <li><strong>HM Revenue & Customs</strong> (HMRC) to comply with UK tax and anti-money laundering regulations</li>
              <li><strong>Technology providers</strong> (hosting, email delivery) under strict data processing agreements</li>
            </ul>
            <p className="mt-3">
              All third parties are required to process your data only in accordance with our instructions and applicable data protection law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">6. International Data Transfers</h2>
            <p>
              As an international firm operating across the UK, UAE, and Indonesia, your data may be transferred outside the United Kingdom and European Economic Area (EEA). Where we transfer data to countries without an adequacy decision from the UK government or European Commission, we implement appropriate safeguards including:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Standard Contractual Clauses (SCCs) approved by the relevant supervisory authority</li>
              <li>Binding Corporate Rules where applicable</li>
              <li>Data processing agreements with all third-party service providers</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">7. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to fulfil the purposes described in this policy:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Enquiry data:</strong> 3 years from last contact</li>
              <li><strong>Marketing consent:</strong> Until you withdraw consent or 2 years of inactivity</li>
              <li><strong>Property transaction data:</strong> 7 years (required by HMRC for tax purposes)</li>
              <li><strong>Document copies (title deed, passport):</strong> 7 years post-transaction completion</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">8. Your Rights Under UK GDPR</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Right of access:</strong> Request a copy of your personal data (Subject Access Request)</li>
              <li><strong>Right to rectification:</strong> Correct any inaccurate or incomplete data</li>
              <li><strong>Right to erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Right to restrict processing:</strong> Request we limit how we use your data</li>
              <li><strong>Right to data portability:</strong> Receive your data in a structured, commonly used format</li>
              <li><strong>Right to object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Rights related to automated decision-making:</strong> Not subject to purely automated decisions with significant effects</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@hausofestate.com" className="text-trust-teal hover:underline">
                privacy@hausofestate.com
              </a>
              . We will respond within <strong>30 days</strong>.
            </p>
            <p className="mt-2">
              You also have the right to lodge a complaint with the{" "}
              <strong>Information Commissioner's Office (ICO)</strong> if you believe we have not handled your data correctly.
              Website:{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-trust-teal hover:underline">
                ico.org.uk
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">9. Cookies and Tracking</h2>
            <p>
              Our website uses cookies to improve your browsing experience. For detailed information about the cookies we use and how to manage them, please see our{" "}
              <Link href="/cookie-policy" className="text-trust-teal hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The latest version will always be available on our website with the date of the last update displayed at the top.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or how we handle your personal data, please contact our Data Protection Officer:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a href="mailto:privacy@hausofestate.com" className="text-trust-teal hover:underline">
                privacy@hausofestate.com
              </a>
              <br />
              <strong>Post:</strong> Haus of Estate Ltd, [Registered Address], England
            </p>
          </section>

        </div>

        <div className="mt-12 rounded-xl border border-border bg-surface p-6">
          <h3 className="font-serif text-lg font-medium text-estate-700 mb-2">Need help with a data request?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our team can assist with subject access requests, corrections, or deletion requests within 30 days.
          </p>
          <Button asChild className="bg-estate-700 text-white hover:bg-estate-600">
            <Link href="mailto:privacy@hausofestate.com">Contact our Data Protection Team</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}