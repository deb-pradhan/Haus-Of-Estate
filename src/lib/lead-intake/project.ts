import { client } from "@/sanity";
import { LeadInfrastructureError, LeadValidationError } from "./errors";

export interface PublishedProjectContext {
  slug: string;
  title: string;
  community?: string;
}

const PUBLISHED_PROPERTY_QUERY = `
  *[
    _type == "property" &&
    !(_id in path("drafts.**")) &&
    status == "published" &&
    slug.current == $slug
  ][0]{
    "slug": slug.current,
    title,
    community
  }
`;

export async function resolvePublishedProject(
  slug: string | undefined,
): Promise<PublishedProjectContext | undefined> {
  if (!slug) return undefined;

  let project: PublishedProjectContext | null;
  try {
    project = await client.fetch<PublishedProjectContext | null>(
      PUBLISHED_PROPERTY_QUERY,
      { slug },
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
