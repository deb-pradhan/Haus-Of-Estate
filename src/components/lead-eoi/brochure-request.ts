import type { LeadBrochureRequest, LeadProjectContext } from "./types";

const MESSAGE_LIMIT = 2_000;

function contextLabel(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

/** Enquiry notes only: approved brochure selection must be resolved on the server. */
export function brochureRequestNote(
  project: LeadProjectContext | undefined,
  request: LeadBrochureRequest | undefined,
): string {
  if (!request) return "";
  const property = project
    ? `${contextLabel(project.title ?? project.slug)} (${contextLabel(project.slug)})`
    : "selected property";
  const design = request.design
    ? `\nRequested design: ${contextLabel(request.design.label)} (${contextLabel(request.design.id)})`
    : "";
  return `Full brochure request: ${property}${design}`;
}

export function brochureMessageLimit(note: string): number {
  return MESSAGE_LIMIT - (note ? note.length + 2 : 0);
}

export function leadMessageWithBrochureRequest(note: string, message: string) {
  return [note, message.trim()].filter(Boolean).join("\n\n") || undefined;
}
