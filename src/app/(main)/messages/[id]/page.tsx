"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send, Paperclip, CalendarPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockThreads, formatPrice } from "@/data/mock";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

const mockMessages: Message[] = [
  {
    id: "msg-1",
    threadId: "thread-1",
    senderId: "user-1",
    content: "Hi, I'm interested in this property. Is it still available?",
    createdAt: "2026-02-18T10:00:00Z",
    read: true,
  },
  {
    id: "msg-2",
    threadId: "thread-1",
    senderId: "agent-1",
    content:
      "Hello! Yes, this unit is still available. It's one of the best in the building with unobstructed marina views. Would you like to schedule a viewing?",
    createdAt: "2026-02-18T10:15:00Z",
    read: true,
  },
  {
    id: "msg-3",
    threadId: "thread-1",
    senderId: "user-1",
    content: "Yes, I'd like that. Also, when was the last renovation done?",
    createdAt: "2026-02-19T14:00:00Z",
    read: true,
  },
  {
    id: "msg-4",
    threadId: "thread-1",
    senderId: "agent-1",
    content:
      "The unit was last renovated in 2025. I can arrange a viewing this weekend if you're interested?",
    createdAt: "2026-02-20T09:30:00Z",
    read: false,
  },
];

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const thread = mockThreads.find((t) => t.id === id);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium">Thread not found</p>
      </div>
    );
  }

  const agent = thread.participants.find((p) => p.role === "agent");

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      threadId: thread.id,
      senderId: "user-1",
      content: newMessage,
      createdAt: new Date().toISOString(),
      read: true,
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem-4rem)] flex-col md:h-[calc(100vh-4rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/messages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={agent?.avatar ?? ""}
          alt={agent?.name ?? ""}
          width={36}
          height={36}
          className="rounded-full"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{agent?.name}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {thread.property.title}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/properties/${thread.propertyId}`}>
            <Info className="mr-1.5 h-3 w-3" />
            Property
          </Link>
        </Button>
      </div>

      {/* Property context card */}
      <div className="border-b border-border bg-subtle px-4 py-2">
        <Link
          href={`/properties/${thread.propertyId}`}
          className="flex items-center gap-3"
        >
          <Image
            src={thread.property.media.thumbnail}
            alt={thread.property.title}
            width={48}
            height={36}
            className="rounded object-cover"
          />
          <div className="flex-1 text-xs">
            <p className="font-medium">{thread.property.title}</p>
            <p className="text-muted-foreground">
              {formatPrice(thread.property.price)}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            <CalendarPlus className="mr-1 h-3 w-3" />
            Book Viewing
          </Badge>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.map((msg) => {
            const isMe = msg.senderId === "user-1";
            return (
              <div
                key={msg.id}
                className={cn("flex", isMe ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    isMe
                      ? "rounded-br-md bg-estate-700 text-white"
                      : "rounded-bl-md bg-surface border border-border"
                  )}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      isMe ? "text-white/50" : "text-muted-foreground"
                    )}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
