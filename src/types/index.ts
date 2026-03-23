export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  propertyType: "apartment" | "villa" | "townhouse" | "penthouse" | "land";
  listingType: "sale" | "rent" | "off-plan";
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaUnit: "sqft" | "sqm";
  location: {
    area: string;
    city: string;
    building?: string;
    lat?: number;
    lng?: number;
  };
  media: {
    video?: string;
    images: string[];
    thumbnail: string;
  };
  features: string[];
  agent: AgentSummary;
  status: "active" | "under-offer" | "sold" | "draft";
  verified: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  avatar: string;
  agency: string;
  responseTime: string;
}

export interface Agent extends AgentSummary {
  bio: string;
  phone: string;
  email: string;
  languages: string[];
  specializations: string[];
  activeListings: number;
  dealsCompleted: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  joinedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface MessageThread {
  id: string;
  propertyId: string;
  property: Pick<Property, "id" | "title" | "media" | "price" | "currency">;
  participants: { id: string; name: string; avatar: string; role: "buyer" | "agent" }[];
  lastMessage: Message;
  unreadCount: number;
  createdAt: string;
}

export interface ViewingRequest {
  id: string;
  propertyId: string;
  property: Pick<Property, "id" | "title" | "media" | "location" | "price" | "currency" | "propertyType" | "bedrooms" | "bathrooms" | "area" | "areaUnit">;
  buyerId: string;
  agentId: string;
  agent: Pick<Agent, "id" | "name" | "avatar" | "agency" | "phone" | "responseTime" | "rating" | "reviewCount">;
  preferredSlots: string[];
  confirmedSlot?: string;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  viewingType: "in-person" | "video-call";
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  propertyId: string;
  buyerId: string;
  agentId: string;
  amount: number;
  currency: string;
  terms: string;
  status: "open" | "countered" | "accepted" | "rejected" | "expired";
  history: OfferEvent[];
  createdAt: string;
  expiresAt: string;
}

export interface OfferEvent {
  id: string;
  type: "submitted" | "countered" | "accepted" | "rejected" | "expired";
  amount?: number;
  terms?: string;
  by: string;
  createdAt: string;
}

export interface Review {
  id: string;
  agentId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  text: string;
  type: "post-viewing" | "post-deal";
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "buyer" | "agent" | "admin";
  savedProperties: string[];
}

export type SearchFilters = {
  query?: string;
  area?: string;
  propertyType?: Property["propertyType"];
  listingType?: Property["listingType"];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  sortBy?: "newest" | "price-asc" | "price-desc" | "featured";
};
