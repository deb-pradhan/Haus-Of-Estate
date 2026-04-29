"use client";

const ACTIVITIES = [
  { type: "deal", label: "Dubai Marina villa secured for a UK buyer", price: "" },
  { type: "offer", label: "Manchester townhouse — under offer in 9 days", price: "" },
  { type: "booking", label: "Sarah M. booked a consultation", price: "" },
  { type: "deal", label: "Bali villa completed for an international family", price: "" },
  { type: "offer", label: "Downtown Dubai flat agreed below asking", price: "" },
  { type: "booking", label: "James T. booked a market briefing", price: "" },
  { type: "deal", label: "London flat completed for an overseas investor", price: "" },
  { type: "offer", label: "Birmingham home — offer accepted in 5 days", price: "" },
  { type: "booking", label: "Priya & Arjun L. listed their property with us", price: "" },
  { type: "deal", label: "JVC studio matched with an off-plan investor", price: "" },
  { type: "booking", label: "Family from Riyadh booked a viewing tour", price: "" },
  { type: "offer", label: "Off-plan penthouse reserved for a returning client", price: "" },
];

const TAG_STYLES: Record<string, string> = {
  deal: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  offer: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  new: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  booking: "bg-gold-500/15 text-gold-600 border-gold-500/30",
};

const TAG_LABELS: Record<string, string> = {
  deal: "Sold",
  offer: "Under Offer",
  new: "New Listing",
  booking: "Booked",
};

export function SocialProofStrip() {
  const doubled = [...ACTIVITIES, ...ACTIVITIES];

  return (
    <section className="overflow-hidden border-b border-border bg-surface py-3" aria-label="Live property activity">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="mx-4 flex items-center gap-2 text-sm">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${TAG_STYLES[item.type]}`}
            >
              {TAG_LABELS[item.type]}
            </span>
            <span className="font-medium text-foreground">{item.label}</span>
            {item.price && (
              <span className="text-muted-foreground">{item.price}</span>
            )}
            <span className="mx-2 text-border" aria-hidden>•</span>
          </span>
        ))}
      </div>
    </section>
  );
}
