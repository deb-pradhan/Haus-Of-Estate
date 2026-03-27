import Link from "next/link";
import { ArrowRight, BadgeCheck, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoFeed } from "@/components/property/video-feed";
import { PropertyGrid } from "@/components/property/property-grid";
import { properties } from "@/data/mock";

const featuredProperties = properties.filter((p) => p.featured);
const latestProperties = properties.slice(0, 6);

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-estate-700 px-4 py-16 md:px-6 md:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold-500" />
          <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-gold-500" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl font-medium leading-tight text-white md:text-6xl md:leading-[1.05]">
              Buy with clarity.
              <br />
              Close with confidence.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/70 md:text-xl">
              Verified properties, trusted agents, and transparent transactions.
              Dubai&apos;s transaction-first real estate platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-gold-500 text-white hover:bg-gold-400"
              >
                <Link href="/search">
                  Explore Properties
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-b border-border bg-surface px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground md:gap-12">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-trust-teal" />
            <span>Verified Listings</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-estate-700" />
            <span>Trusted Agents</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-action-amber" />
            <span>Transparent Transactions</span>
          </div>
        </div>
      </section>

      {/* Video-first featured */}
      <section className="px-4 py-10 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl font-medium md:text-3xl">
                Featured Properties
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Hand-picked listings with video tours
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden md:flex">
              <Link href="/search?featured=true">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <VideoFeed properties={featuredProperties} />
        </div>
      </section>

      {/* Latest listings */}
      <section className="bg-subtle px-4 py-10 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl font-medium md:text-3xl">
                Latest Listings
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Newly verified properties in Dubai
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden md:flex">
              <Link href="/search">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <PropertyGrid properties={latestProperties} />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 py-10 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-2xl font-medium md:text-3xl">
              How Haus of Estate Works
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              From discovery to closing, every step is transparent and tracked.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "01",
                title: "Discover",
                desc: "Browse verified video-first listings filtered by your preferences.",
              },
              {
                step: "02",
                title: "Connect",
                desc: "Message agents directly. No WhatsApp runaround.",
              },
              {
                step: "03",
                title: "View",
                desc: "Book viewings with confirmed time slots and status tracking.",
              },
              {
                step: "04",
                title: "Transact",
                desc: "Submit offers, negotiate in-app, and track every step to close.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-estate-700/10 font-serif text-sm font-semibold text-estate-700 md:mx-0">
                  {item.step}
                </div>
                <h3 className="mb-1 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-estate-700 px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-medium text-white md:text-4xl">
            Property, with proof.
          </h2>
          <p className="mt-3 text-white/60">
            Join the platform where every listing is verified, every agent is
            accountable, and every transaction is transparent.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gold-500 text-white hover:bg-gold-400"
            >
              <Link href="/auth/register">Get Started</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/search">Browse Properties</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
