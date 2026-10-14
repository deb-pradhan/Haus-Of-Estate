import { LeadEoiForm } from "@/components/lead-eoi/lead-eoi-form";
import { EnquiryUnavailable } from "@/components/lead-eoi/enquiry-unavailable";
import { isLeadIntakeReady } from "@/lib/lead-intake/security";

export default function ListPropertyPage() {
  if (!isLeadIntakeReady()) return <EnquiryUnavailable />;
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <h1 className="font-serif text-4xl text-estate-700">Sell or let your property.</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">Tell us about your property and how to contact you. Our team can discuss any documents needed after your initial enquiry.</p>
      <div className="mt-8 rounded-2xl border border-border bg-white p-5 sm:p-8">
        <LeadEoiForm surface="register_interest" initialInterest="sell_let" />
      </div>
    </section>
  );
}
