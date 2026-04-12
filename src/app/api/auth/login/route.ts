import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { sendLoginAlertEmail } from "@/lib/email/resend";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, password, device } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Send login alert email (async, non-blocking)
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      sendLoginAlertEmail(
        email,
        user.name,
        device ?? "Unknown device"
      ).catch((err) =>
        console.error("Failed to send login alert email:", err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}