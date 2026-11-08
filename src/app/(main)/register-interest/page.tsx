import type { Metadata } from "next";
import { isLeadIntakeReady } from "@/lib/lead-intake/security";
import { EnquiryUnavailable } from "@/components/lead-eoi/enquiry-unavailable";
import { Check, Clock3, LockKeyhole } from "lucide-react";
import { LeadEoiForm } from "@/components/lead-eoi/lead-eoi-form";
import type {
  LeadInterest,
  LeadLaunchContext,
  LeadProjectContext,
} from "@/components/lead-eoi/types";
import { findLaunchInterest } from "@/lib/launches/registry";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";
import { sanityFetch } from "@/sanity/live";

const PROJECT_CONTEXT_QUERY = `
  *[_type == "property" && status == "published" && slug.current == $slug][0] {
    title,
    "slug": slug.current,
    community,
    masterDevelopment,
    city,
    country,
    unitType,
    bedrooms,
    bathrooms,
    listingType
  }
`;

export const metadata: Metadata = {
  title: "Register your property interest",
  description:
    "Tell Haus of Estate whether you want to buy, rent, invest, sell or let, and receive a tailored response from the team.",
  alternates: { canonical: "/register-interest" },
  openGraph: {
    title: "Register your property interest — Haus of Estate",
    description:
      "Share your property goals with Haus of Estate and receive a tailored response from a market specialist.",
    url: "/register-interest",
    type: "website",
    images: DEFAULT_OG_IMAGES,
  },
  twitter: {
    card: "summary_large_image",
    title: "Register your property interest — Haus of Estate",
    description:
      "Share your property goals with Haus of Estate and receive a tailored response from a market specialist.",
    images: [DEFAULT_OG_IMAGES[0].url],
  },
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getProjectContext(
  rawSlug: string | undefined,
): Promise<LeadProjectContext | undefined> {
  const slug = rawSlug?.trim().toLowerCase();
  if (!slug || slug.length > 96 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return undefined;
  }

  const { data } = await sanityFetch<LeadProjectContext>({
    query: PROJECT_CONTEXT_QUERY,
    params: { slug },
  });

  return data ?? undefined;
}

/** `?launch=<key>` names a pre-launch project from the code allowlist, not a CMS record. */
function getLaunchContext(rawKey: string | undefined): LeadLaunchContext | undefined {
  const launch = findLaunchInterest(rawKey);
  if (!launch) return undefined;
  return {
    key: launch.key,
    title: launch.title,
    developer: launch.developer,
    community: launch.community,
    city: launch.city,
    country: launch.country,
    unitTypes: launch.reportedUnitTypes,
    bedrooms: launch.reportedBedrooms,
    qualification: launch.qualification,
  };
}

function inferProjectInterest(
  project: LeadProjectContext | undefined,
): LeadInterest | undefined {
  return project?.listingType?.length === 1 && project.listingType[0] === "rent"
    ? "rent"
    : project
      ? "buy"
      : undefined;
}

export default async function RegisterInterestPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isLeadIntakeReady()) return <EnquiryUnavailable />;

  const query = await searchParams;
  const project = await getProjectContext(firstSearchParam(query.project));
  const launch = project ? undefined : getLaunchContext(firstSearchParam(query.launch));

  return (
    <div className="bg-subtle">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 lg:py-20">
        <section className="self-start lg:sticky lg:top-28">
          <p className="text-xs font-semibold uppercase text-estate-700">
            Property enquiries
          </p>
          <h1 className="mt-3 max-w-xl font-serif text-4xl font-medium leading-tight text-estate-700 sm:text-5xl">
            {launch ? `Register your interest in ${launch.title}` : "Register your interest"}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            {launch
              ? `Tell us the home type, size and timing you have in mind and a Haus of Estate consultant will follow up as official ${launch.developer ?? "developer"} information is released.`
              : "Tell us what you are looking for and we will direct your enquiry to the right Haus of Estate specialist."}
          </p>
          {launch?.qualification ? (
            <p className="mt-4 max-w-lg rounded-md border border-gold-500/35 bg-gold-500/10 px-3.5 py-3 text-sm leading-6 text-estate-700">
              {launch.qualification}
            </p>
          ) : null}
          <ul className="mt-8 space-y-4 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-estate-700" aria-hidden="true" />
              Buy, rent, invest, sell or let through one short form
            </li>
            <li className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-estate-700" aria-hidden="true" />
              Complete it in around two minutes
            </li>
            <li className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-estate-700" aria-hidden="true" />
              Property enquiries do not require marketing consent; newsletter
              registration requires an affirmative choice
            </li>
          </ul>
        </section>

        <section
          aria-label="Register your interest form"
          className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-8"
        >
          <LeadEoiForm
            surface="register_interest"
            project={project}
            launchInterest={launch}
            initialInterest={inferProjectInterest(project)}
          />
        </section>
      </div>
    </div>
  );
}
