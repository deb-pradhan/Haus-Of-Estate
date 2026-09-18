import { normalizeEmail } from "@/lib/auth/contracts";

type UserVerificationWriter = {
  user: {
    updateMany: (args: {
      where: { id: string; email: string };
      data: { emailVerified: Date };
    }) => Promise<{ count: number }>;
  };
};

type GoogleVerificationInput = {
  userId?: string;
  userEmail?: string | null;
  profileEmail?: unknown;
  profileEmailVerified?: unknown;
};

export async function syncVerifiedGoogleUser(
  client: UserVerificationWriter,
  input: GoogleVerificationInput,
  now = new Date(),
) {
  if (
    !input.userId ||
    !input.userEmail ||
    input.profileEmailVerified !== true ||
    typeof input.profileEmail !== "string"
  ) {
    return false;
  }

  let userEmail: string;
  let profileEmail: string;
  try {
    userEmail = normalizeEmail(input.userEmail);
    profileEmail = normalizeEmail(input.profileEmail);
  } catch {
    return false;
  }

  if (userEmail !== profileEmail) return false;

  await client.user.updateMany({
    where: { id: input.userId, email: profileEmail },
    data: { emailVerified: now },
  });
  return true;
}
