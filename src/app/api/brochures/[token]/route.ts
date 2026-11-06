import { Readable } from "node:stream";
import { openApprovedBrochure } from "../../../../lib/brochures/catalog";
import { verifyBrochureDownloadToken } from "../../../../lib/brochures/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const claims = verifyBrochureDownloadToken(token);
    const { brochure, handle } = await openApprovedBrochure(claims.key, claims.revision, claims.projectSlug);
    const stream = Readable.toWeb(handle.createReadStream({ start: 0, autoClose: true }));
    return new Response(stream as ReadableStream<Uint8Array>, {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Length": String(brochure.sizeBytes),
        "Content-Disposition": `attachment; filename="${brochure.filename}"`,
      },
    });
  } catch {
    return new Response("This brochure link is unavailable or has expired. Please request a new brochure.", {
      status: 404,
      headers: { ...privateHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
