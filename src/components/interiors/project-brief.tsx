"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { useLeadEoi } from "@/components/lead-eoi/lead-eoi-controller";
import { INTERIOR_GOALS, INTERIOR_ROOMS, buildInteriorEnquiryHref, type InteriorGoal, type InteriorRoom } from "@/lib/interiors-enquiry";

export function InteriorProjectBrief() {
  const { enabled } = useLeadEoi();
  const id = useId();
  const [goal, setGoal] = useState<InteriorGoal>("not-sure");
  const [room, setRoom] = useState<InteriorRoom>("not-sure");
  const goalLabel = INTERIOR_GOALS.find(option => option.value === goal)!.label;
  const roomLabel = INTERIOR_ROOMS.find(option => option.value === room)!.label;
  const emailHref = `mailto:info@hausofestate.com?subject=${encodeURIComponent("Interiors & Renovations enquiry")}&body=${encodeURIComponent(`Hello Haus of Estate,\n\nI would like to discuss an interiors project.\n\nGoal: ${goalLabel}\nRoom / scope: ${roomLabel}\n\nProperty type:\nApproximate budget (if known):\nAnything else I have in mind:\n`)}`;

  return (
    <div className="grid overflow-hidden rounded-2xl border border-estate-700/15 bg-white lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-8 p-5 sm:p-8 lg:p-9">
        <fieldset>
          <legend className="mb-4 text-sm font-semibold">01 / What would you like to do?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTERIOR_GOALS.map(({ value, label }) => <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${goal === value ? "border-estate-700 bg-estate-700/5" : "border-estate-700/15 hover:border-estate-700/40"}`}>
              <input type="radio" name={`${id}-goal`} value={value} checked={goal === value} onChange={() => setGoal(value)} className="size-4 shrink-0 accent-estate-700" />{label}
            </label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-4 text-sm font-semibold">02 / Which space are you thinking about?</legend>
          <div className="flex flex-wrap gap-2">
            {INTERIOR_ROOMS.map(({ value, label }) => <label key={value} className={`relative inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 py-2 text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-estate-700 ${room === value ? "border-estate-700 bg-estate-700 text-white" : "border-estate-700/20 hover:border-estate-700/50"}`}>
              <input type="radio" name={`${id}-room`} value={value} checked={room === value} onChange={() => setRoom(value)} className="sr-only" />{label}
            </label>)}
          </div>
        </fieldset>
      </div>
      <div className="flex flex-col justify-between border-t border-estate-700/10 bg-[#e9eee6] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-estate-700/60">Your starting point</p>
          <div aria-live="polite" aria-atomic="true" className="mt-5 min-h-24">
            <p className="font-serif text-3xl font-medium leading-tight">{goal === "not-sure" ? "Let’s explore the possibilities." : goalLabel}</p>
            <p className="mt-3 text-sm text-estate-700/75">{room === "not-sure" ? "We can work through the room choices together." : roomLabel}</p>
          </div>
          <p className="mt-5 text-sm leading-7 text-estate-700/75">{enabled ? "Next, add your property type, a rough budget if you have one, and the best way to reach you." : "Share these ideas with our team by email. You can add your property type and a rough budget before sending."}</p>
        </div>
        <div className="mt-8">
          {enabled ? <Link href={buildInteriorEnquiryHref(goal, room)} prefetch={false} className="inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-lg bg-estate-700 px-5 py-3 text-sm font-semibold text-white hover:bg-estate-600">Continue to your enquiry <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></Link>
            : <a href={emailHref} className="inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-lg bg-estate-700 px-5 py-3 text-sm font-semibold text-white hover:bg-estate-600">Discuss your project by email <Mail className="size-4 shrink-0" aria-hidden="true" /></a>}
          <p className="mt-3 text-xs leading-5 text-estate-700/65">{enabled ? "Your choices are a starting point, not a booking or a quote." : "Opens your email app. Your brief is only sent when you send the email."}</p>
          {!enabled && <p className="mt-2 text-xs text-estate-700/70">info@hausofestate.com</p>}
        </div>
      </div>
    </div>
  );
}
