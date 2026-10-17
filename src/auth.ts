import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { clampString, normaliseEmail, safeRedirectPath } from "@/lib/security";

// A real bcrypt hash (cost 14, matching /api/auth/register) of a random string.
// Compared against when the account does not exist so response time does not
// reveal which emails are registered.
const DUMMY_PASSWORD_HASH =
  "$2b$14$OwdBVAdxdTRluOhWlgpBw.XNbXrE47gqZnT7bmYcg8D79rxpfSpeq";

// bcrypt only uses the first 72 bytes; cap input so a huge password cannot be
// used to burn CPU.
const MAX_PASSWORD_LENGTH = 72;

const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

// Extend session with user fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // The app runs behind Railway's proxy; AUTH_URL pins the canonical origin.
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    // Only register Google when it is configured, instead of failing at
    // runtime with empty credentials.
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
          }),
        ]
      : []),
    Credentials({
      name: "email-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Values arrive as `unknown`: reject objects/arrays so they can never
        // reach a Prisma filter as an operator.
        const rawEmail = clampString(credentials?.email, 254);
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!rawEmail || !password || password.length > MAX_PASSWORD_LENGTH) {
          return null;
        }

        // Accounts created before emails were normalised may be mixed-case, so
        // try the exact value first, then the lower-cased form.
        const email = normaliseEmail(rawEmail);
        const user =
          (await db.user.findUnique({ where: { email: rawEmail } })) ??
          (email !== rawEmail
            ? await db.user.findUnique({ where: { email } })
            : null);

        // Always run one bcrypt comparison (constant-ish time), and never say
        // whether the email or the password was wrong.
        const valid = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH
        );
        if (!user || !user.passwordHash || !valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14, // 14 days
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    // Same-site relative redirects only: blocks `?callbackUrl=https://evil.com`.
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${safeRedirectPath(url, "/")}`;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {
        // fall through
      }
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "BUYER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
});