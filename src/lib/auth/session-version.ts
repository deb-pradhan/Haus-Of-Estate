export function isCurrentSessionVersion(
  tokenVersion: unknown,
  currentVersion: number,
) {
  return (typeof tokenVersion === "number" ? tokenVersion : 0) === currentVersion;
}
