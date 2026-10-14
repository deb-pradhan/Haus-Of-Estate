import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  normalizeEmail,
  passwordSchema,
  registerSchema,
} from "@/lib/auth/contracts";
import { safeReturnTo } from "@/lib/auth/safe-return-to";

describe("auth contracts", () => {
  it("normalizes email addresses before lookup", () => {
    expect(normalizeEmail("  Surya@Example.COM ")).toBe("surya@example.com");
    expect(
      credentialsSchema.parse({
        email: "  Surya@Example.COM ",
        password: "a password",
      }).email,
    ).toBe("surya@example.com");
  });

  it("normalizes names and optional phone input", () => {
    const result = registerSchema.parse({
      name: "  Surya   Kommuri  ",
      email: "surya@example.com",
      password: "secure-password",
      phone: "   ",
    });

    expect(result.name).toBe("Surya Kommuri");
    expect(result.phone).toBeUndefined();
  });

  it("rejects passwords beyond bcrypt's UTF-8 byte limit", () => {
    expect(passwordSchema.safeParse("a".repeat(72)).success).toBe(true);
    expect(passwordSchema.safeParse("£".repeat(37)).success).toBe(false);
  });
});

describe("safeReturnTo", () => {
  it.each([
    "https://attacker.example/steal",
    "//attacker.example/steal",
    "/\\attacker.example/steal",
    "/%2Fattacker.example/steal",
    "/%252Fattacker.example/steal",
    "/javascript:alert(1)",
    "/saved\u0000",
  ])("rejects unsafe return target %s", (target) => {
    expect(safeReturnTo(target, "/fallback")).toBe("/fallback");
  });

  it("preserves a same-site path, query, and fragment", () => {
    expect(safeReturnTo("/saved?tab=articles#latest")).toBe(
      "/saved?tab=articles#latest",
    );
  });
});
