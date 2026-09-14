"use client";

import { MessageCircle } from "lucide-react";
import { usePropertyAssistant } from "@/components/property-assistant/property-assistant-provider";
import { cn } from "@/lib/utils";

const WHATSAPP_URL =
  "https://wa.me/447496033321?utm_source=site&utm_medium=float&utm_campaign=whatsapp";

export function WhatsAppFloat() {
  const { enabled: assistantEnabled, isOpen: assistantOpen } =
    usePropertyAssistant();

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      aria-hidden={assistantOpen}
      tabIndex={assistantOpen ? -1 : 0}
      className={cn(
        "fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-[#25D366]/40",
        assistantEnabled ? "bottom-24" : "bottom-6",
        assistantOpen && "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      {/* Pulse rings */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" style={{ animationDelay: "0.5s" }} />

      <MessageCircle className="relative h-7 w-7 fill-white stroke-[#25D366]" strokeWidth={1.5} />
    </a>
  );
}
