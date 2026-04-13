"use client";

import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "+971 58 560 7033";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-transform duration-200 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/40"
    >
      {/* Pulse rings */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" style={{ animationDelay: "0.5s" }} />

      <MessageCircle className="relative h-7 w-7 fill-white stroke-[#25D366]" strokeWidth={1.5} />
    </a>
  );
}
