import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, {
  type DefaultSession,
  type NextAuthConfig,
} from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { credentialsSchema, normalizeEmail } from "@/lib/auth/contracts";
import { syncVerifiedGoogleUser } from "@/lib/auth/google-verification";
import { isGoogleAuthEnabled } from "@/lib/auth/provider-config";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { isCurrentSessionVersion } from "@/lib/auth/session-version";
import { enforceAuthThrottle } from "@/lib/auth/throttle";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface User {
    role?: string;
    sessionVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      sessionVersion: number;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    sessionVersion?: number;
  }
}

const TEN_MINUTES = 10 * 60 * 1_000;
const INVALID_PASSWORD_HASH =
  "$2b$12$Vo/GWoSdQnqg.hUOQE1ZkuxCg0nyK6hSZHLKEdG9yuZaeZrwkLqRm";

const credentialsProvider = Credentials({
  name: "email-password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials, request) {
    const parsed = credentialsSchema.safeParse(credentials);
    if (!parsed.success) return null;

    const throttle = await enforceAuthThrottle(request, {
      scope: "LOGIN",
      identifier: { kind: "email", value: parsed.data.email },
      ip: { limit: 10, windowMs: TEN_MINUTES },
      identifierRule: { limit: 5, windowMs: TEN_MINUTES },
    });
    if (!throttle.allowed) return null;

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        emailVerified: true,
        disabledAt: true,
        sessionVersion: true,
      },
    });

    // Keep invalid accounts on the same expensive comparison path as bad passwords.
    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      user?.passwordHash ?? INVALID_PASSWORD_HASH,
    );

    if (
      !user ||
      !user.passwordHash ||
      !passwordMatches ||
      !user.emailVerified ||
      user.disabledAt
    ) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionVersion: user.sessionVersion,
    };
  },
});

const providers: NextAuthConfig["providers"] = [credentialsProvider];

if (isGoogleAuthEnabled()) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: normalizeEmail(profile.email),
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
    }),
  );
}

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers,
  session: { strategy: "jwt" },
  trustHost:
    process.env.NODE_ENV !== "production" ||
    process.env.AUTH_TRUST_HOST === "true",
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "google") {
        return syncVerifiedGoogleUser(db, {
          userId: user.id,
          userEmail: user.email,
          profileEmail: profile?.email,
          profileEmailVerified: profile?.email_verified,
        });
      }

      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      const userId = user?.id ?? token.id;
      if (typeof userId !== "string") return null;

      const currentUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          emailVerified: true,
          disabledAt: true,
          sessionVersion: true,
        },
      });

      if (
        !currentUser ||
        currentUser.disabledAt ||
        !currentUser.emailVerified ||
        !isCurrentSessionVersion(
          token.sessionVersion,
          currentUser.sessionVersion,
        )
      ) {
        return null;
      }

      token.id = currentUser.id;
      token.sub = currentUser.id;
      token.email = currentUser.email;
      token.name = currentUser.name;
      token.picture = currentUser.image;
      token.role = currentUser.role;
      token.sessionVersion = currentUser.sessionVersion;
      return token;
    },
    async session({ session, token }) {
      if (!session.user || typeof token.id !== "string") return session;

      session.user.id = token.id;
      session.user.role =
        typeof token.role === "string" ? token.role : "BUYER";
      session.user.sessionVersion =
        typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return new URL(safeReturnTo(url), baseUrl).toString();
      }

      try {
        const target = new URL(url);
        return target.origin === baseUrl ? target.toString() : baseUrl;
      } catch {
        return baseUrl;
      }
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
