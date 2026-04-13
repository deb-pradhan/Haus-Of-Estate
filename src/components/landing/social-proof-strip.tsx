"use client";

const ACTIVITIES = [
  { type: "deal", label: "Villa in Dubai Marina sold", price: "AED 4.2M" },
  { type: "offer", label: "3-Bed in Manchester under offer", price: "GBP 680K" },
  { type: "new", label: "Penthouse in Palm Jumeirah listed", price: "AED 18.5M" },
  { type: "booking", label: "Sarah M. booked a free consultation", price: "" },
  { type: "deal", label: "Townhouse in Canggu sold", price: "IDR 12B" },
  { type: "offer", label: "2-Bed in Downtown Dubai under offer", price: "AED 3.1M" },
  { type: "new", label: "Villa in Ubud newly listed", price: "IDR 9.8B" },
  { type: "booking", label: "James T. booked a market briefing", price: "" },
  { type: "deal", label: "Apartment in London sold", price: "GBP 920K" },
  { type: "offer", label: "5-Bed in Birmingham under offer", price: "GBP 1.1M" },
  { type: "new", label: "Duplex in Dubai Creek Harbour listed", price: "AED 7.8M" },
  { type: "booking", label: "Priya & Arjun L. listed their villa", price: "" },
  { type: "deal", label: "Studio in JVC sold", price: "AED 1.4M" },
  { type: "offer", label: "4-Bed Villa in Palm under offer", price: "AED 12M" },
  { type: "new", label: "Penthouse in Manchester new listing", price: "GBP 2.3M" },
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
