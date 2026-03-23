"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  Phone,
  Star,
  Video,
  Building2,
  BedDouble,
  Bath,
  Ruler,
  ChevronRight,
  RotateCcw,
  Ban,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockViewings, formatPrice } from "@/data/mock";
import type { ViewingRequest } from "@/types";

const statusConfig = {
  requested: {
    label: "Awaiting Confirmation",
    icon: Clock,
    className: "bg-action-amber/10 text-action-amber border-action-amber/20",
    dot: "bg-action-amber",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-trust-teal/10 text-trust-teal border-trust-teal/20",
    dot: "bg-trust-teal",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
};

type TabFilter = "all" | "upcoming" | "completed" | "cancelled";

function filterViewings(viewings: ViewingRequest[], tab: TabFilter) {
  switch (tab) {
    case "upcoming":
      return viewings.filter(
        (v) => v.status === "confirmed" || v.status === "requested"
      );
    case "completed":
      return viewings.filter((v) => v.status === "completed");
    case "cancelled":
      return viewings.filter((v) => v.status === "cancelled");
    default:
      return viewings;
  }
}

function getStats(viewings: ViewingRequest[]) {
  return {
    total: viewings.length,
    upcoming: viewings.filter(
      (v) => v.status === "confirmed" || v.status === "requested"
    ).length,
    completed: viewings.filter((v) => v.status === "completed").length,
    cancelled: viewings.filter((v) => v.status === "cancelled").length,
  };
}

function ViewingCard({ viewing }: { viewing: ViewingRequest }) {
  const status = statusConfig[viewing.status];
  const StatusIcon = status.icon;
  const confirmedDate = viewing.confirmedSlot
    ? new Date(viewing.confirmedSlot)
    : null;
  const isActive =
    viewing.status === "confirmed" || viewing.status === "requested";

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Property Image */}
          <Link
            href={`/properties/${viewing.propertyId}`}
            className="relative block h-48 w-full shrink-0 sm:h-auto sm:w-44"
          >
            <Image
              src={viewing.property.media.thumbnail}
              alt={viewing.property.title}
              fill
              sizes="(max-width: 640px) 100vw, 176px"
              className="object-cover"
            />
            {viewing.viewingType === "video-call" && (
              <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                <Video className="h-3 w-3" />
                Video Tour
              </div>
            )}
            <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {formatPrice(viewing.property.price, viewing.property.currency)}
            </div>
          </Link>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col p-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/properties/${viewing.propertyId}`}
                  className="line-clamp-1 text-sm font-semibold hover:text-estate-700"
                >
                  {viewing.property.title}
                </Link>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">
                    {viewing.property.location.building &&
                      `${viewing.property.location.building}, `}
                    {viewing.property.location.area},{" "}
                    {viewing.property.location.city}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className={status.className}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </div>

            {/* Property specs */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {viewing.property.propertyType.charAt(0).toUpperCase() +
                  viewing.property.propertyType.slice(1)}
              </span>
              {viewing.property.bedrooms > 0 && (
                <span className="flex items-center gap-1">
                  <BedDouble className="h-3 w-3" />
                  {viewing.property.bedrooms} Bed
                </span>
              )}
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {viewing.property.bathrooms} Bath
              </span>
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {viewing.property.area.toLocaleString()}{" "}
                {viewing.property.areaUnit}
              </span>
            </div>

            <Separator className="my-3" />

            {/* Date/time + Agent row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-2">
                {/* Confirmed date */}
                {confirmedDate && (
                  <div className="flex items-center gap-2 rounded-lg bg-trust-teal/5 px-3 py-2">
                    <CalendarCheck className="h-4 w-4 shrink-0 text-trust-teal" />
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {confirmedDate.toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {confirmedDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {viewing.viewingType === "video-call"
                          ? " — Video Call"
                          : " — In Person"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Requested slots (pending) */}
                {viewing.status === "requested" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-action-amber">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span className="font-medium">
                        Waiting for agent to confirm
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {viewing.preferredSlots.map((slot) => {
                        const d = new Date(slot);
                        return (
                          <span
                            key={slot}
                            className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground"
                          >
                            {d.toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            {d.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewing.notes && (
                  <p className="max-w-sm text-xs italic text-muted-foreground">
                    &ldquo;{viewing.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Agent mini-card */}
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-2 pr-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={viewing.agent.avatar} />
                  <AvatarFallback>
                    {viewing.agent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <Link
                    href={`/agent/${viewing.agent.id}`}
                    className="block text-xs font-semibold leading-tight hover:text-estate-700"
                  >
                    {viewing.agent.name}
                  </Link>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>{viewing.agent.agency}</span>
                    <span className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-action-amber text-action-amber" />
                      {viewing.agent.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isActive && (
              <>
                <Separator className="my-3" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                    <Link href={`/messages`}>
                      <MessageSquare className="mr-1.5 h-3 w-3" />
                      Message Agent
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <Phone className="mr-1.5 h-3 w-3" />
                    Call
                  </Button>
                  {viewing.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-8 text-xs text-muted-foreground"
                    >
                      <RotateCcw className="mr-1.5 h-3 w-3" />
                      Reschedule
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-destructive/80 hover:text-destructive"
                  >
                    <Ban className="mr-1.5 h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </>
            )}

            {viewing.status === "completed" && (
              <>
                <Separator className="my-3" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" className="h-8 text-xs" asChild>
                    <Link href={`/properties/${viewing.propertyId}`}>
                      <Eye className="mr-1.5 h-3 w-3" />
                      Make an Offer
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                    <Link href={`/messages`}>
                      <MessageSquare className="mr-1.5 h-3 w-3" />
                      Message Agent
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-8 text-xs"
                  >
                    <Star className="mr-1.5 h-3 w-3" />
                    Leave Review
                  </Button>
                </div>
              </>
            )}

            {viewing.status === "cancelled" && (
              <>
                <Separator className="my-3" />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                    <Link href={`/properties/${viewing.propertyId}`}>
                      <RotateCcw className="mr-1.5 h-3 w-3" />
                      Rebook Viewing
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface px-4 py-3">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ?? "bg-muted"}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-semibold leading-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function ViewingsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const stats = getStats(mockViewings);
  const filtered = filterViewings(mockViewings, activeTab);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium">Viewings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and manage your property viewing requests
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Viewings"
          value={stats.total}
          icon={CalendarCheck}
          accent="bg-estate-700/10 text-estate-700"
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={Clock}
          accent="bg-trust-teal/10 text-trust-teal"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          accent="bg-muted text-muted-foreground"
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          icon={XCircle}
          accent="bg-destructive/10 text-destructive"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabFilter)}
        className="mb-4"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
              {stats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
              {stats.upcoming}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <CalendarCheck className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-medium">
                {activeTab === "all"
                  ? "No viewings scheduled"
                  : `No ${activeTab} viewings`}
              </p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                {activeTab === "all"
                  ? "Book a viewing from any property page to get started."
                  : "Check other tabs or browse properties to book a new viewing."}
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/search">
                  Browse Properties
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((viewing) => (
                <ViewingCard key={viewing.id} viewing={viewing} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
