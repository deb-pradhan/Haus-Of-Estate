/**
 * Estimate reading time (minutes) from a Portable Text body array.
 * Counts words in every span's text at ~225 wpm, min 1 minute.
 */
export function readingTimeFromBlocks(blocks: unknown): number {
  if (!Array.isArray(blocks)) return 1
  let words = 0
  const walk = (nodes: unknown): void => {
    if (!Array.isArray(nodes)) return
    for (const node of nodes as Array<Record<string, unknown>>) {
      if (typeof node?.text === "string") {
        words += node.text.trim().split(/\s+/).filter(Boolean).length
      }
      if (Array.isArray(node?.children)) walk(node.children)
    }
  }
  walk(blocks)
  return Math.max(1, Math.round(words / 225))
}

/** Stable slug id for a heading, matching the Table of Contents generator. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
