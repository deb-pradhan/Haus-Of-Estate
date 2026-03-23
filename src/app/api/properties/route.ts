import { NextRequest, NextResponse } from "next/server";
import { properties, formatPrice } from "@/data/mock";
import type { SearchFilters } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  let result = [...properties];

  const query = searchParams.get("q");
  const area = searchParams.get("area");
  const propertyType = searchParams.get("propertyType");
  const listingType = searchParams.get("listingType");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minBedrooms = searchParams.get("minBedrooms");
  const sortBy = searchParams.get("sortBy") ?? "newest";

  if (query) {
    const q = query.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.location.area.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (area) result = result.filter((p) => p.location.area === area);
  if (propertyType) result = result.filter((p) => p.propertyType === propertyType);
  if (listingType) result = result.filter((p) => p.listingType === listingType);
  if (minPrice) result = result.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice));
  if (minBedrooms) result = result.filter((p) => p.bedrooms >= Number(minBedrooms));

  switch (sortBy) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "featured":
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
    default:
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  return NextResponse.json({
    data: result,
    total: result.length,
  });
}
