import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicyPage() {
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
          <h1 className="font-serif text-4xl font-medium text-estate-700">Cookie Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently, improve user experience, and provide information to website owners.
            </p>
            <p className="mt-2">
              This Cookie Policy explains how Haus of Estate ("we", "our", "us") uses cookies and similar technologies in compliance with the UK Privacy and Electronic Communications Regulations (PECR) 2003 and the UK General Data Protection Regulation (UK GDPR).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">2. Why We Use Cookies</h2>
            <p>We use cookies for the following purposes:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Essential functionality:</strong> To enable core website features such as navigation, form submissions, and secure areas</li>
              <li><strong>Performance:</strong> To understand how visitors use our website and identify areas for improvement</li>
              <li><strong>Analytics:</strong> To collect anonymous data about page visits, time spent, and user journeys</li>
              <li><strong>Marketing:</strong> To deliver relevant advertisements and track campaign performance (where consent has been given)</li>
              <li><strong>Preference storage:</strong> To remember your settings and preferences across visits</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">3. Categories of Cookies We Use</h2>

            <div className="space-y-4 mt-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-medium text-estate-700 mb-2">Strictly Necessary Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  These cookies are essential for the website to function properly. They enable core features such as security, accessibility, and session management. These cookies do not require your consent under PECR because they are necessary for the service explicitly requested by the user.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Examples:</strong> Authentication tokens, security cookies, cookies required to maintain your session when filling in forms.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-medium text-estate-700 mb-2">Performance Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  These cookies collect anonymous information about how visitors use our website — such as which pages are most visited, where users come from, and how long they spend on each page. This helps us understand user behaviour and improve our website.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Legal basis:</strong> Consent required under PECR and UK GDPR.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-medium text-estate-700 mb-2">Functionality Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  These cookies remember your preferences and settings — such as your language, region, or currency — so you don't have to re-enter them on each visit. They may also remember choices you've made (such as your name or email address) to provide a more personalised experience.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Legal basis:</strong> Consent required.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-medium text-estate-700 mb-2">Marketing Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  These cookies track your browsing habits across websites to build a profile of your interests and show you relevant advertisements. They are also used to measure the effectiveness of advertising campaigns.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Legal basis:</strong> Explicit consent required. We will not use marketing cookies without your permission.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">4. Third-Party Cookies</h2>
            <p>Some cookies on our website are set by third-party services. These include:</p>
            <ul className="mt-2 space-y-2 list-disc pl-5">
              <li>
                <strong>Google Analytics:</strong> To understand how visitors use our website. Google Analytics collects data about page visits, time spent, and navigation patterns. This data is anonymous and helps us improve our website. You can opt out of Google Analytics by installing the{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-trust-teal hover:underline">
                  Google Analytics Opt-out Browser Add-on
                </a>.
              </li>
              <li>
                <strong>Google Fonts:</strong> To display fonts consistently across our website
              </li>
              <li>
                <strong>Calendly:</strong> If you book a call through our site, Calendly may set cookies to manage the scheduling session
              </li>
              <li>
                <strong>YouTube / Vimeo:</strong> Embedded videos may set cookies to track video playback and engagement
              </li>
              <li>
                <strong>Social media platforms:</strong> If you share content from our website via social media (e.g. WhatsApp, LinkedIn), those platforms may set cookies on your device
              </li>
            </ul>
            <p className="mt-3">
              Third-party cookies are governed by the respective third party's privacy and cookie policies.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">5. Cookies We Use — Detailed List</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-border">
                <thead>
                  <tr className="bg-subtle">
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">Cookie Name</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">Category</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">Purpose</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">Duration</th>
                    <th className="border border-border px-3 py-2 text-left font-medium text-foreground">Consent Required</th>
                  </tr>
                </thead>
                <tbody className="bg-surface">
                  <tr>
                    <td className="border border-border px-3 py-2">_ga</td>
                    <td className="border border-border px-3 py-2">Analytics</td>
                    <td className="border border-border px-3 py-2">Google Analytics — distinguishes unique users</td>
                    <td className="border border-border px-3 py-2">2 years</td>
                    <td className="border border-border px-3 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2">_gid</td>
                    <td className="border border-border px-3 py-2">Analytics</td>
                    <td className="border border-border px-3 py-2">Google Analytics — distinguishes unique users</td>
                    <td className="border border-border px-3 py-2">24 hours</td>
                    <td className="border border-border px-3 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2">_gat</td>
                    <td className="border border-border px-3 py-2">Performance</td>
                    <td className="border border-border px-3 py-2">Google Analytics — rate limiting</td>
                    <td className="border border-border px-3 py-2">1 minute</td>
                    <td className="border border-border px-3 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2">NEXT_LOCALE</td>
                    <td className="border border-border px-3 py-2">Functionality</td>
                    <td className="border border-border px-3 py-2">Remembers your language preference</td>
                    <td className="border border-border px-3 py-2">1 year</td>
                    <td className="border border-border px-3 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-3 py-2">Intercom-id</td>
                    <td className="border border-border px-3 py-2">Functionality</td>
                    <td className="border border-border px-3 py-2">Live chat session management</td>
                    <td className="border border-border px-3 py-2">9 months</td>
                    <td className="border border-border px-3 py-2">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">6. Your Consent Choices</h2>
            <p>
              When you first visit our website, you will be presented with a cookie consent banner that allows you to accept or reject non-essential cookies. You can change your preferences at any time by:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Clicking the "Cookie Settings" link in the footer of our website</li>
              <li>Contacting us at{" "}
                <a href="mailto:privacy@hausofestate.com" className="text-trust-teal hover:underline">
                  privacy@hausofestate.com
                </a>
              </li>
            </ul>
            <p className="mt-3">
              <strong>Important:</strong> If you reject non-essential cookies, some features of our website may not function correctly. Strictly necessary cookies will still be set as they are required for the website to operate.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">7. Managing Cookies in Your Browser</h2>
            <p>
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>See what cookies are stored on your device</li>
              <li>Delete all or specific cookies</li>
              <li>Block cookies from all or specific websites</li>
              <li>Block third-party cookies</li>
              <li>Clear all cookies when you close your browser</li>
            </ul>
            <p className="mt-3">
              Instructions for popular browsers:
            </p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and site data</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies</li>
            </ul>
            <p className="mt-3">
              Note: Blocking cookies may affect the functionality of our website and other websites you visit.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">8. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our use of cookies or legal requirements. The latest version will always be available on our website with the date of the last update displayed at the top.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-estate-700 mb-3">9. Contact</h2>
            <p>
              If you have any questions about our use of cookies, please contact us:
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
          <h3 className="font-serif text-lg font-medium text-estate-700 mb-2">Want to manage your cookie preferences?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adjust your consent settings or request deletion of any data we have collected about you.
          </p>
          <div className="flex gap-3">
            <Button asChild className="bg-estate-700 text-white hover:bg-estate-600">
              <Link href="mailto:privacy@hausofestate.com">Contact our Privacy Team</Link>
            </Button>
            <Button variant="outline" asChild className="border-estate-700 text-estate-700">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}