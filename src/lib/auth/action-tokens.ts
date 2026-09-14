import { createHash, randomBytes } from "node:crypto";
import {
  authDb,
  type AuthActionTokenRecord,
  type AuthActionTokenType,
  type AuthTransaction,
} from "@/lib/auth/auth-db";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1_000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1_000;

interface ActionTokenMaterial {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export function hashActionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function createActionToken(
  type: AuthActionTokenType,
  now = new Date(),
): ActionTokenMaterial {
  const rawToken = randomBytes(32).toString("base64url");
  const ttlMs =
    type === "EMAIL_VERIFICATION"
      ? EMAIL_VERIFICATION_TTL_MS
      : PASSWORD_RESET_TTL_MS;
  return {
    rawToken,
    tokenHash: hashActionToken(rawToken),
    expiresAt: new Date(now.getTime() + ttlMs),
  };
}

async function storeActionToken(
  transaction: AuthTransaction,
  userId: string,
  type: AuthActionTokenType,
  token: ActionTokenMaterial,
): Promise<AuthActionTokenRecord> {
  return transaction.authActionToken.create({
    data: {
      userId,
      type,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      usedAt: null,
    },
  });
}

export async function issueActionToken(
  userId: string,
  type: AuthActionTokenType,
): Promise<string> {
  const token = createActionToken(type);
  await authDb.$transaction((transaction) =>
    storeActionToken(transaction, userId, type, token),
  );
  return token.rawToken;
}

export async function activateIssuedActionToken(
  userId: string,
  type: AuthActionTokenType,
  rawToken: string,
): Promise<void> {
  const now = new Date();
  const tokenHash = hashActionToken(rawToken);
  await authDb.$transaction(
    async (transaction) => {
      await transaction.authActionToken.updateMany({
        where: {
          userId,
          type,
          tokenHash: { not: tokenHash },
          usedAt: null,
        },
        data: { usedAt: now },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function createUnverifiedUserWithToken(input: {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
}): Promise<{ userId: string; rawToken: string }> {
  const token = createActionToken("EMAIL_VERIFICATION");
  const userId = await authDb.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        passwordHash: input.passwordHash,
        emailVerified: null,
      },
    });
    await storeActionToken(
      transaction,
      user.id,
      "EMAIL_VERIFICATION",
      token,
    );
    return user.id;
  });
  return { userId, rawToken: token.rawToken };
}

async function claimToken(
  transaction: AuthTransaction,
  rawToken: string,
  type: AuthActionTokenType,
  now: Date,
): Promise<AuthActionTokenRecord | null> {
  const tokenHash = hashActionToken(rawToken);
  const record = await transaction.authActionToken.findUnique({
    where: { tokenHash },
  });
  if (
    !record ||
    record.type !== type ||
    record.usedAt !== null ||
    record.expiresAt <= now
  ) {
    return null;
  }

  const claimed = await transaction.authActionToken.updateMany({
    where: {
      id: record.id,
      type,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });
  return claimed.count === 1 ? record : null;
}

export async function verifyEmailWithToken(rawToken: string): Promise<boolean> {
  return runSerializable(async (transaction) => {
    const now = new Date();
    const record = await claimToken(
      transaction,
      rawToken,
      "EMAIL_VERIFICATION",
      now,
    );
    if (!record) return false;

    await transaction.user.update({
      where: { id: record.userId },
      data: { emailVerified: now },
    });
    await transaction.authActionToken.updateMany({
      where: {
        userId: record.userId,
        type: "EMAIL_VERIFICATION",
        usedAt: null,
      },
      data: { usedAt: now },
    });
    return true;
  });
}

function isSerializationConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  );
}

async function runSerializable<T>(
  operation: (transaction: AuthTransaction) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await authDb.$transaction(operation, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (!isSerializationConflict(error) || attempt === 2) throw error;
    }
  }
  throw new Error("Serializable transaction retry exhausted");
}

export async function resetPasswordWithToken(
  rawToken: string,
  passwordHash: string,
): Promise<boolean> {
  return runSerializable(async (transaction) => {
    const now = new Date();
    const record = await claimToken(
      transaction,
      rawToken,
      "PASSWORD_RESET",
      now,
    );
    if (!record) return false;

    await transaction.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
    });
    await transaction.session.deleteMany({ where: { userId: record.userId } });
    await transaction.authActionToken.updateMany({
      where: {
        userId: record.userId,
        type: "PASSWORD_RESET",
        usedAt: null,
      },
      data: { usedAt: now },
    });
    return true;
  });
}
