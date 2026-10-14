export const INTERIOR_GOALS = [
  { value: "refresh", label: "Refresh a room" },
  { value: "renovate", label: "Plan a renovation" },
  { value: "furnish", label: "Furnish a property" },
  { value: "finish", label: "Style the finishing touches" },
  { value: "lighting", label: "Explore lighting design" },
  { value: "not-sure", label: "I'm not sure yet" },
] as const;

export const INTERIOR_ROOMS = [
  { value: "living-room", label: "Living room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "home-office", label: "Home office" },
  { value: "whole-property", label: "Whole property" },
  { value: "not-sure", label: "I'm not sure yet" },
] as const;

export const INTERIOR_PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment or flat" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "commercial", label: "Commercial space" },
  { value: "other", label: "Other" },
  { value: "not-sure", label: "I'm not sure yet" },
] as const;

export type InteriorGoal = (typeof INTERIOR_GOALS)[number]["value"];
export type InteriorRoom = (typeof INTERIOR_ROOMS)[number]["value"];
export type InteriorPropertyType = (typeof INTERIOR_PROPERTY_TYPES)[number]["value"];
export interface InteriorEnquiryContext {
  goal: InteriorGoal;
  room: InteriorRoom;
}
export type EnquirySearchParams = Record<string, string | string[] | undefined>;

function allowedValue<T extends string>(
  value: unknown,
  options: ReadonlyArray<{ value: T; label: string }>,
): T | undefined {
  return options.find((option) => option.value === value)?.value;
}

/** Only predefined, non-personal choices are accepted from a public URL. */
export function readInteriorEnquiryContext(
  query: EnquirySearchParams,
): InteriorEnquiryContext | undefined {
  if (query.service !== "interiors") return undefined;
  return {
    goal: allowedValue(query.goal, INTERIOR_GOALS) ?? "not-sure",
    room: allowedValue(query.room, INTERIOR_ROOMS) ?? "not-sure",
  };
}

export function buildInteriorEnquiryHref(
  goal: InteriorGoal = "not-sure",
  room: InteriorRoom = "not-sure",
): string {
  const query = new URLSearchParams({
    service: "interiors",
    goal: allowedValue(goal, INTERIOR_GOALS) ?? "not-sure",
    room: allowedValue(room, INTERIOR_ROOMS) ?? "not-sure",
  });
  return `/enquire?${query.toString()}`;
}

export interface InteriorBrief extends InteriorEnquiryContext {
  propertyType: InteriorPropertyType | "";
  budget: string;
  message: string;
}

// Reserve space for the labelled brief inside the API's 2,000-character message.
export const INTERIOR_MESSAGE_MAX_LENGTH = 1_500;
export const INTERIOR_BUDGET_MAX_LENGTH = 80;

/** The brief stays in the existing durable message field; it is never analytics data. */
export function composeInteriorEnquiryMessage(brief: InteriorBrief): string {
  const goal = INTERIOR_GOALS.find((option) => option.value === brief.goal)?.label;
  const room = INTERIOR_ROOMS.find((option) => option.value === brief.room)?.label;
  const propertyType = INTERIOR_PROPERTY_TYPES.find(
    (option) => option.value === brief.propertyType,
  )?.label;
  const summary = [
    "Interiors & Renovations enquiry",
    goal && `Goal: ${goal}`,
    room && `Room or space: ${room}`,
    propertyType && `Property type: ${propertyType}`,
    brief.budget.trim() && `Approximate budget: ${brief.budget.trim().replace(/\s+/g, " ")}`,
  ].filter(Boolean).join("\n");
  return `${summary}\n\n${brief.message.trim()}`;
}
