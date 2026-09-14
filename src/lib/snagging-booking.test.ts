import { describe, expect, it } from "vitest";
import { readSnaggingBookingConfig } from "./snagging-booking";

describe("snagging booking configuration", () => {
  it("keeps bookings unavailable until the connected calendar is enabled", () => {
    expect(readSnaggingBookingConfig({})).toBeNull();
    expect(readSnaggingBookingConfig({ SNAGGING_BOOKING_URL: "https://example.com/book" })).toBeNull();
    expect(readSnaggingBookingConfig({ SNAGGING_BOOKING_ENABLED: "true" })).toBeNull();
  });

  it.each(["http://example.com", "javascript:alert(1)", "not-a-url", "https://secret@example.com/book"])(
    "does not expose an invalid or credential-bearing booking link: %s",
    (bookingUrl) => {
      expect(readSnaggingBookingConfig({ SNAGGING_BOOKING_ENABLED: "true", SNAGGING_BOOKING_URL: bookingUrl })).toBeNull();
    },
  );

  it("preserves the provider's public booking and optional embed links", () => {
    expect(readSnaggingBookingConfig({
      SNAGGING_BOOKING_ENABLED: "true",
      SNAGGING_BOOKING_URL: "https://example.com/book#snagging",
      SNAGGING_BOOKING_EMBED_URL: "https://example.com/embed?service=inspection",
    })).toEqual({
      bookingUrl: "https://example.com/book#snagging",
      embedUrl: "https://example.com/embed?service=inspection",
    });
  });

  it("retains a valid direct booking link when embedding is not configured safely", () => {
    expect(readSnaggingBookingConfig({
      SNAGGING_BOOKING_ENABLED: "true",
      SNAGGING_BOOKING_URL: "https://example.com/book",
      SNAGGING_BOOKING_EMBED_URL: "http://example.com/embed",
    })).toEqual({ bookingUrl: "https://example.com/book" });
  });
});
