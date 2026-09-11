export function isSavedContentEnabled(): boolean {
  return process.env.SAVED_CONTENT_ENABLED === "true";
}
