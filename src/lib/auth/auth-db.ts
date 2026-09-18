import { db } from "@/lib/db";

export type AuthActionTokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export interface AuthActionTokenRecord {
  id: string;
  userId: string;
  type: AuthActionTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface AuthThrottleRecord {
  id: string;
  scope: string;
  keyHash: string;
  windowStart: Date;
  attempts: number;
  blockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUserRecord {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  passwordHash: string | null;
  emailVerified: Date | null;
  sessionVersion: number;
  disabledAt: Date | null;
}

interface AuthActionTokenDelegate {
  create(args: { data: Omit<AuthActionTokenRecord, "id" | "createdAt"> }): Promise<AuthActionTokenRecord>;
  findUnique(args: { where: { tokenHash: string } }): Promise<AuthActionTokenRecord | null>;
  updateMany(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<{ count: number }>;
}

interface AuthThrottleDelegate {
  create(args: {
    data: Omit<AuthThrottleRecord, "id" | "createdAt" | "updatedAt">;
  }): Promise<AuthThrottleRecord>;
  findUnique(args: {
    where: { scope_keyHash: { scope: string; keyHash: string } };
  }): Promise<AuthThrottleRecord | null>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<AuthThrottleRecord>;
}

interface AuthUserDelegate {
  create(args: {
    data: {
      name: string;
      email: string;
      phone: string | null;
      passwordHash: string;
      emailVerified: Date | null;
    };
  }): Promise<AuthUserRecord>;
  findUnique(args: { where: { email?: string; id?: string } }): Promise<AuthUserRecord | null>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<AuthUserRecord>;
}

interface AuthSessionDelegate {
  deleteMany(args: { where: { userId: string } }): Promise<{ count: number }>;
}

export interface AuthTransaction {
  authActionToken: AuthActionTokenDelegate;
  authThrottle: AuthThrottleDelegate;
  user: AuthUserDelegate;
  session: AuthSessionDelegate;
}

export interface AuthDatabase extends AuthTransaction {
  $transaction<T>(
    operation: (transaction: AuthTransaction) => Promise<T>,
    options?: { isolationLevel?: "Serializable" },
  ): Promise<T>;
}

export const authDb = db as unknown as AuthDatabase;
