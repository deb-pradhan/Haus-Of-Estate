import { beforeAll, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn(async () => ({ id: "email-id" })));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { sendLeadNotificationToAdmin } from "./resend";

describe("lead notification email", () => {
  beforeAll(() => {
    process.env.RESEND_API_KEY = "re_test_only";
  });

  it("escapes HTML fields and removes subject control characters", async () => {
    await sendLeadNotificationToAdmin({
      email: 'person@example.com\"><img src=x onerror=alert(1)>',
      firstName: "Alex\r\nBcc: attacker@example.com <script>alert(1)</script>",
      intent: "buy</td><td>spoofed",
      tier: "warm",
      score: 30,
      phone: "+44<script>alert(1)</script>",
    });

    const calls = send.mock.calls as unknown[][];
    const message = calls[0]?.[0] as {
      subject: string;
      html: string;
    };
    expect(message.subject).not.toMatch(/[\r\n]/);
    expect(message.html).not.toContain("<script>");
    expect(message.html).not.toContain("<img");
    expect(message.html).toContain("&lt;script&gt;");
    expect(message.html).toContain("&quot;&gt;&lt;img");
  });
});
