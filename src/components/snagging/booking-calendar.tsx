"use client";

import { useState } from "react";
import { CalendarDays, ExternalLink } from "lucide-react";
import type { SnaggingBookingConfig } from "@/lib/snagging-booking";

export function SnaggingBookingCalendar({ config }: { config: SnaggingBookingConfig | null }) {
  const [opened, setOpened] = useState(false);

  return (
    <section id="booking" aria-labelledby="snagging-booking-title" className="scroll-mt-24 border-t border-border bg-canvas px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <CalendarDays className="mx-auto h-7 w-7 text-estate-700" aria-hidden="true" />
          <h2 id="snagging-booking-title" className="mt-4 font-serif text-3xl font-medium text-estate-700 md:text-4xl">Arrange your inspection.</h2>
          {config ? (
            <>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Choose a date and time from our booking calendar. Check the service, property location and time zone before confirming. Your appointment is booked once you receive the calendar&apos;s confirmation.
              </p>
              {config.embedUrl && !opened && (
                <button type="button" onClick={() => setOpened(true)} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-estate-700 px-6 py-3 text-sm font-semibold text-white hover:bg-estate-600">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" /> Open booking calendar
                </button>
              )}
              <p className="mt-4 text-sm">
                <a href={config.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-medium text-estate-700 underline underline-offset-4">
                  Book in a new tab <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">The calendar is provided by our scheduling partner and loads when you open it. Their privacy notice applies to the booking details you enter.</p>
            </>
          ) : (
            <>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">Online booking is not available yet. Contact our team for a quote and to arrange an inspection date and time.</p>
              <a href="#quote" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-estate-700 px-6 py-3 text-sm font-semibold text-white hover:bg-estate-600">Discuss your inspection</a>
            </>
          )}
        </div>
        {config?.embedUrl && opened && (
          <iframe src={config.embedUrl} title="Snagging inspection booking calendar" className="mt-8 h-[780px] w-full rounded-xl border border-border bg-white" referrerPolicy="no-referrer" />
        )}
      </div>
    </section>
  );
}
