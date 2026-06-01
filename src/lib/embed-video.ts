/**
 * Convert a YouTube or Vimeo URL into an embeddable iframe URL.
 * Returns null if the URL isn't a recognised YouTube or Vimeo link.
 */
export function toEmbedUrl(input: string): string | null {
  const url = input.trim();
  // YouTube — youtu.be short and watch?v= long forms
  const yt = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/,
  );
  if (yt) {
    return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  }
  // Vimeo — vimeo.com/<id>
  const v = url.match(/vimeo\.com\/(?:video\/)?(\d{5,})/);
  if (v) {
    return `https://player.vimeo.com/video/${v[1]}`;
  }
  return null;
}
