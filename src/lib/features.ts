export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED === "true";
}

export function isSavedContentEnabled(): boolean {
  return isAuthEnabled() && process.env.SAVED_CONTENT_ENABLED === "true";
}

export function isPropertyAssistantEnabled(): boolean {
  return isAuthEnabled() && process.env.PROPERTY_ASSISTANT_ENABLED === "true";
}
