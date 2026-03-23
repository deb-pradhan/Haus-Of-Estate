"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockThreads, formatPrice } from "@/data/mock";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your conversations with agents
        </p>
      </div>

      {mockThreads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">No messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a conversation by messaging an agent on any property.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {mockThreads.map((thread) => {
            const agent = thread.participants.find((p) => p.role === "agent");
            const timeSince = getTimeSince(thread.lastMessage.createdAt);

            return (
              <Link key={thread.id} href={`/messages/${thread.id}`}>
                <Card
                  className={cn(
                    "flex items-start gap-3 p-4 transition-colors hover:bg-subtle",
                    thread.unreadCount > 0 && "border-estate-700/20 bg-estate-700/[0.02]"
                  )}
                >
                  <div className="relative shrink-0">
                    <Image
                      src={thread.property.media.thumbnail}
                      alt={thread.property.title}
                      width={56}
                      height={56}
                      className="rounded-lg object-cover"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={agent?.avatar ?? ""}
                      alt={agent?.name ?? ""}
                      width={24}
                      height={24}
                      className="absolute -bottom-1 -right-1 rounded-full border-2 border-surface"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={cn(
                        "truncate text-sm",
                        thread.unreadCount > 0 ? "font-semibold" : "font-medium"
                      )}>
                        {agent?.name}
                      </h3>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeSince}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {thread.property.title} · {formatPrice(thread.property.price)}
                    </p>
                    <p className={cn(
                      "mt-1 truncate text-sm",
                      thread.unreadCount > 0
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}>
                      {thread.lastMessage.senderId === "user-1" && "You: "}
                      {thread.lastMessage.content}
                    </p>
                  </div>

                  {thread.unreadCount > 0 && (
                    <Badge className="mt-1 shrink-0 bg-estate-700 text-white border-0">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTimeSince(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
