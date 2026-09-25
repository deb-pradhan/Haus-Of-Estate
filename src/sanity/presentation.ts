import type { PresentationPluginOptions } from "sanity/presentation";

type PresentationResolve = NonNullable<PresentationPluginOptions["resolve"]>;

function documentLocation(
  typeLabel: string,
  routePrefix: string,
  value: Record<string, unknown> | null,
) {
  const title = typeof value?.title === "string" ? value.title : typeLabel;
  const slug = typeof value?.slug === "string" ? value.slug : "";

  if (!slug) {
    return {
      message: `${typeLabel} needs a slug before it can be previewed.`,
      tone: "caution" as const,
    };
  }

  return {
    locations: [{ title, href: `${routePrefix}/${slug}` }],
  };
}

export const presentationResolve = {
  mainDocuments: [
    {
      route: "/blog/:slug",
      filter: '_type == "post" && slug.current == $slug',
      params: ({ params }) => ({ slug: params.slug }),
    },
    {
      route: "/properties/:slug",
      filter: '_type == "property" && slug.current == $slug',
      params: ({ params }) => ({ slug: params.slug }),
    },
    {
      route: "/careers/:slug",
      filter: '_type == "role" && slug.current == $slug',
      params: ({ params }) => ({ slug: params.slug }),
    },
  ],
  locations: {
    post: {
      select: { title: "title", slug: "slug.current" },
      resolve: (value) => documentLocation("Article", "/blog", value),
    },
    property: {
      select: { title: "title", slug: "slug.current" },
      resolve: (value) => documentLocation("Property", "/properties", value),
    },
    role: {
      select: { title: "title", slug: "slug.current" },
      resolve: (value) => documentLocation("Role", "/careers", value),
    },
  },
} satisfies PresentationResolve;
