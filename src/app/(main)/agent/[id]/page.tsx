import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Star,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyGrid } from "@/components/property/property-grid";
import { getAgent, getAgentProperties, getAgentReviews } from "@/data/mock";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AgentProfilePage({ params }: Props) {
  const { id } = await params;
  const agent = getAgent(id);

  if (!agent) {
    notFound();
  }

  const agentProperties = getAgentProperties(id);
  const reviews = getAgentReviews(id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/search">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Profile header */}
      <div className="mb-8 flex flex-col items-start gap-6 md:flex-row md:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={agent.avatar}
          alt={agent.name}
          width={96}
          height={96}
          className="rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-medium">{agent.name}</h1>
            {agent.verified && (
              <BadgeCheck className="h-5 w-5 text-trust-teal" />
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{agent.agency}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Star className="mr-1 h-3 w-3 fill-action-amber text-action-amber" />
              {agent.rating} ({agent.reviewCount} reviews)
            </Badge>
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              Responds {agent.responseTime}
            </Badge>
            <Badge variant="secondary">{agent.dealsCompleted} deals closed</Badge>
            <Badge variant="secondary">{agent.activeListings} active listings</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {agent.specializations.map((s) => (
              <Badge key={s} variant="outline" className="text-[10px]">
                {s}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2 self-start">
          <Button>
            <MessageSquare className="mr-1.5 h-4 w-4" />
            Message
          </Button>
          <Button variant="outline">
            <Phone className="mr-1.5 h-4 w-4" />
            Call
          </Button>
        </div>
      </div>

      {/* Bio */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="mb-2 text-sm font-semibold">About</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{agent.bio}</p>

          <Separator className="my-4" />

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              {agent.languages.join(", ")}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              {agent.email}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Dubai, UAE
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Listings + Reviews */}
      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">
            Listings ({agentProperties.length})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4">
          <PropertyGrid properties={agentProperties} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          {reviews.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No reviews yet.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {review.reviewerName}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {review.type === "post-deal" ? "Post-Deal" : "Post-Viewing"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < review.rating
                                ? "fill-action-amber text-action-amber"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {review.text}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
