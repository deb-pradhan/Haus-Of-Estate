export function isSavedContentEnabled(): boolean {
  return process.env.SAVED_CONTENT_ENABLED === "true";
}

export function isPropertyAssistantEnabled(): boolean {
  return process.env.PROPERTY_ASSISTANT_ENABLED === "true";
}
