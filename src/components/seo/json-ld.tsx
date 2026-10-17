import { serializeJsonLd } from "@/lib/seo";

/**
 * Renders schema.org JSON-LD as an inline <script type="application/ld+json">.
 * Server-component friendly (no client JS). Safe against "</script>" injection.
 *
 *   <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, ...])} />
 *
 * Accepts a single node or an array of nodes. Null/undefined renders nothing,
 * so builders such as `faqJsonLd([])` can be passed straight through.
 */
export function JsonLd({ data }: { data: object | object[] | null | undefined }) {
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
