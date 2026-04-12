import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
          <h1 className="font-serif text-4xl font-medium text-estate-700">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">1. About These Terms</h2>
            <p>
              These Terms of Service ("Terms") govern your use of the Haus of Estate website, services, and any related communications or property advisory services provided by Haus of Estate Ltd ("we", "our", "us"). By accessing our website or using our services, you agree to be bound by these Terms.
            </p>
            <p className="mt-2">
              If you do not agree to these Terms, please do not use our services. These Terms are written in accordance with English law and the UK Consumer Rights Act 2015.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">2. Who We Are</h2>
            <p>
              Haus of Estate Ltd is an international real estate advisory firm providing property matching, investment advisory, and transaction facilitation services across the United Kingdom, United Arab Emirates, and Indonesia.
            </p>
            <p className="mt-2">
              <strong>Registered in:</strong> England and Wales<br />
              <strong>Company number:</strong> [To be confirmed]<br />
              <strong>Contact:</strong>{" "}
              <a href="mailto:info@hausofestate.com" className="text-trust-teal hover:underline">
                info@hausofestate.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">3. Our Services</h2>
            <p>Haus of Estate provides the following services:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Property matching:</strong> Matching buyers, renters, and investors with properties based on stated preferences</li>
              <li><strong>Investment advisory:</strong> Providing market insights, yield analysis, and investment recommendations</li>
              <li><strong>Property listing:</strong> Listing properties for sale or rent on behalf of owners</li>
              <li><strong>Viewing coordination:</strong> Arranging and confirming property viewings with agents</li>
              <li><strong>Transaction facilitation:</strong> Assisting with paperwork, documentation, and communication between parties</li>
            </ul>
            <p className="mt-3">
              <strong>Important:</strong> Haus of Estate acts as an intermediary and advisor, not a solicitor or licensed conveyancer. We do not provide legal advice. For legal matters, you should seek independent legal counsel.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">4. Your Obligations</h2>
            <p>When using our services, you agree to:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Provide accurate and complete information about your property requirements and contact details</li>
              <li>Only use our services for legitimate property enquiries — not for speculative, fraudulent, or illegal purposes</li>
              <li>Not impersonate any other person or entity</li>
              <li>Comply with all applicable laws, including UK and international anti-money laundering regulations</li>
              <li>Notify us promptly if your contact details change</li>
              <li>Not share account access credentials or allow third parties to act on your behalf without written authorisation</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">5. Property Information and Accuracy</h2>
            <p>
              While we strive to ensure that all property information, pricing, and availability details displayed on our website are accurate and up to date, we do not guarantee that the information is complete, accurate, or free from errors.
            </p>
            <p className="mt-2">
              Property details, prices, and availability are subject to change without notice. Haus of Estate is not liable for any discrepancies between information displayed on our website and information provided by third parties, including property developers, agents, or listing platforms.
            </p>
            <p className="mt-2">
              <strong>Verification:</strong> We strongly recommend that you independently verify all property details, ownership status, legal standing, and financial information before committing to any purchase, rental, or investment. Nothing on our website constitutes legal, financial, or investment advice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">6. Marketing and Communications</h2>
            <p>
              By providing your contact details and opting in to our communications, you consent to receiving property alerts, market insights, investment opportunities, and service updates from Haus of Estate.
            </p>
            <p className="mt-2">
              You can withdraw this consent at any time by:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Replying "STOP" to any WhatsApp or SMS message</li>
              <li>Clicking the unsubscribe link in any marketing email</li>
              <li>Contacting us at{" "}
                <a href="mailto:unsubscribe@hausofestate.com" className="text-trust-teal hover:underline">
                  unsubscribe@hausofestate.com
                </a>
              </li>
            </ul>
            <p className="mt-2">
              We comply with UK and EU marketing laws including the Privacy and Electronic Communications Regulations (PECR) 2003 and will only send marketing communications where explicit consent has been given.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">7. Fees and Charges</h2>
            <p>
              Consultation services, where charged, will be clearly communicated before any commitment is made. Haus of Estate may receive commissions or referral fees from property developers, agents, or third parties where a transaction is completed through our introduction.
            </p>
            <p className="mt-2">
              <strong>Free services:</strong> Property matching, viewing coordination, and general enquiry responses are provided without charge unless otherwise stated.
            </p>
            <p className="mt-2">
              <strong>Transaction fees:</strong> If Haus of Estate charges a fee for transaction facilitation, this will be agreed in writing before services are provided. All fees will be disclosed in a separate engagement letter or service agreement.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">8. Limitation of Liability</h2>
            <p>
              Haus of Estate Ltd, its directors, employees, and agents shall not be liable for:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Any loss of profit, revenue, business, or data arising from your use of our services</li>
              <li>Any decisions made based on information provided through our website or communications</li>
              <li>Any discrepancies, inaccuracies, or omissions in property information provided by third parties</li>
              <li>Any failure to complete a property transaction for any reason</li>
              <li>Any losses arising from investments made in properties recommended through our services</li>
            </ul>
            <p className="mt-3">
              Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be limited by English law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">9. Intellectual Property</h2>
            <p>
              All content on our website, including text, graphics, logos, images, and software, is the property of Haus of Estate Ltd or its licensors and is protected by UK and international copyright laws.
            </p>
            <p className="mt-2">
              You may not reproduce, distribute, modify, or create derivative works from any content on our website without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">10. Indemnity</h2>
            <p>
              You agree to indemnify Haus of Estate Ltd, its directors, employees, and agents against any claims, damages, losses, or expenses (including legal fees) arising from your use of our services, your violation of these Terms, or your violation of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">11. Termination</h2>
            <p>
              We may terminate or suspend access to our services at any time if we believe you have violated these Terms or engaged in fraudulent, unlawful, or harmful activity.
            </p>
            <p className="mt-2">
              You may request termination of your account and deletion of your personal data at any time by contacting us at{" "}
              <a href="mailto:info@hausofestate.com" className="text-trust-teal hover:underline">
                info@hausofestate.com
              </a>
              . We will process such requests in accordance with our Privacy Policy and UK GDPR obligations.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">13. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. The latest version will be posted on our website with the date of the last update displayed at the top. Continued use of our services after any changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">14. Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a href="mailto:info@hausofestate.com" className="text-trust-teal hover:underline">
                info@hausofestate.com
              </a>
              <br />
              <strong>Post:</strong> Haus of Estate Ltd, [Registered Address], England
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}