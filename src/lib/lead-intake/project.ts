import { client } from "@/sanity";
import { LeadInfrastructureError, LeadValidationError } from "./errors";

export interface PublishedProjectContext {
  slug: string;
  title: string;
  community?: string;
  designVariants?: Array<{
    _key: string;
    label: string;
    brochureKey?: string;
    brochureRevision?: string;
  }>;
}

export const PUBLISHED_PROPERTY_QUERY = `
  *[
    _type == "property" &&
    !(_id in path("drafts.**")) &&
    !(_id in path("versions.**")) &&
    status == "published" &&
    slug.current == $slug
  ][0]{
    "slug": slug.current,
    title,
    community,
    designVariants[]{_key, label, brochureKey, brochureRevision}
  }
`;

export async function resolvePublishedProject(
  slug: string | undefined,
): Promise<PublishedProjectContext | undefined> {
  if (!slug) return undefined;

  let project: PublishedProjectContext | null;
  try {
    project = await client.withConfig({
      useCdn: false,
      perspective: "published",
    }).fetch<PublishedProjectContext | null>(
      PUBLISHED_PROPERTY_QUERY,
      { slug },
      { cache: "no-store" },
    );
  } catch {
    throw new LeadInfrastructureError();
  }

  if (!project?.slug || !project.title) {
    throw new LeadValidationError("Invalid project", {
      project: ["Select a published property"],
    });
  }
  return project;
}
