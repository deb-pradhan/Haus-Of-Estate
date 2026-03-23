import Image from "next/image";
import Link from "next/link";
import { Star, BadgeCheck, Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Agent } from "@/types";

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
}

export function AgentCard({ agent, compact = false }: AgentCardProps) {
  if (compact) {
    return (
      <Link href={`/agent/${agent.id}`} className="group flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={agent.avatar}
          alt={agent.name}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold group-hover:text-estate-700">
              {agent.name}
            </span>
            {agent.verified && <BadgeCheck className="h-3.5 w-3.5 text-trust-teal" />}
          </div>
          <p className="text-xs text-muted-foreground">{agent.agency}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {agent.responseTime}
        </div>
      </Link>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={agent.avatar}
            alt={agent.name}
            width={56}
            height={56}
            className="rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <Link href={`/agent/${agent.id}`}>
                <h3 className="font-semibold hover:text-estate-700">{agent.name}</h3>
              </Link>
              {agent.verified && (
                <BadgeCheck className="h-4 w-4 text-trust-teal" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{agent.agency}</p>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-[10px]">
                <Star className="mr-0.5 h-3 w-3 fill-action-amber text-action-amber" />
                {agent.rating} ({agent.reviewCount})
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                <Clock className="mr-0.5 h-3 w-3" />
                {agent.responseTime}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {agent.dealsCompleted} deals
              </Badge>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{agent.bio}</p>

        <div className="mt-4 flex gap-2">
          <Button asChild className="flex-1" size="sm">
            <Link href={`/messages?agent=${agent.id}`}>
              <MessageSquare className="mr-1.5 h-4 w-4" />
              Message
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/agent/${agent.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
