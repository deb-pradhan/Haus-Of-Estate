"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const WHATSAPP_URL =
  "https://wa.me/971585607033?utm_source=site&utm_medium=float&utm_campaign=whatsapp";

/**
 * Quiet, always-reachable WhatsApp entry point. No pulsing rings (deference:
 * the page content leads). On property detail pages it lifts above the sticky
 * enquiry bar so the two never overlap.
 */
export function WhatsAppFloat() {
  const pathname = usePathname();
  const onPropertyDetail = /^\/properties\/[^/]+\/?$/.test(pathname) &&
    !/^\/properties\/(residential|commercial)\/?$/.test(pathname);

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cn(
        "pressable fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#128C7E] text-white shadow-e3 hover:scale-105 md:right-6 md:bottom-6",
        onPropertyDetail ? "bottom-24" : "bottom-4",
      )}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.75} aria-hidden />
    </a>
  );
}
