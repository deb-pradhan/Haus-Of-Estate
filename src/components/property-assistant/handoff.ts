import type { BuyerInitialBrief } from "@/components/lead-modal/buyer-modal";
import type {
  AssistantPropertyResult,
  AssistantRecognizedFilters,
} from "./result-parts";

const AREA_IDS: Record<string, BuyerInitialBrief["area"]> = {
  "dubai marina": "marina",
  "downtown dubai": "downtown",
  "palm jumeirah": "palm",
  jbr: "jbr",
  "business bay": "business_bay",
  london: "london",
  manchester: "manchester",
  birmingham: "birmingham",
  liverpool: "liverpool",
  edinburgh: "edinburgh",
  canggu: "canggu",
  seminyak: "seminyak",
  ubud: "ubud",
  uluwatu: "uluwatu",
  sanur: "sanur",
};

function marketFromPlace(placeValue: string): BuyerInitialBrief["market"] {
  const place = placeValue.toLowerCase();
  if (/dubai|united arab emirates|\buae\b/.test(place)) return "dubai";
  if (/bali|indonesia/.test(place)) return "bali";
  if (
    /united kingdom|\buk\b|england|wales|scotland|london|cardiff|manchester/.test(
      place,
    )
  ) {
    return "uk";
  }
  return undefined;
}

function bedroomBrief(value: number | undefined) {
  if (typeof value !== "number" || value < 1) return undefined;
  return value >= 5
    ? "5+"
    : (String(value) as BuyerInitialBrief["bedrooms"]);
}

export function buyerBriefFromProperty(
  property: AssistantPropertyResult,
): BuyerInitialBrief {
  const place = [property.community, property.city, property.country]
    .filter(Boolean)
    .join(" ");
  const normalizedPlace = place.toLowerCase();
  const areaEntry = Object.entries(AREA_IDS).find(([label]) =>
    normalizedPlace.includes(label),
  );
  return {
    intent:
      property.listingType?.includes("rent") &&
      !property.listingType.includes("sale")
        ? "rent"
        : "buy",
    market: marketFromPlace(place),
    area: areaEntry?.[1],
    bedrooms: bedroomBrief(property.bedrooms),
  };
}

export function buyerBriefFromRecognizedFilters(
  filters: AssistantRecognizedFilters,
): BuyerInitialBrief | undefined {
  const location = filters.location?.trim() || "";
  const normalizedLocation = location.toLowerCase();
  const areaEntry = Object.entries(AREA_IDS).find(([label]) =>
    normalizedLocation.includes(label),
  );
  const brief: BuyerInitialBrief = {
    intent:
      filters.intent === "rent"
        ? "rent"
        : filters.intent === "sale"
          ? "buy"
          : undefined,
    market: location ? marketFromPlace(location) : undefined,
    area: areaEntry?.[1],
    bedrooms: bedroomBrief(filters.minBedrooms),
  };
  return Object.values(brief).some(Boolean) ? brief : undefined;
}
