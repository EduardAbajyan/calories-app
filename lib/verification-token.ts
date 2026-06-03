import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

// Token expires in 48 hours
const VERIFICATION_TOKEN_EXPIRY = 2 * 60 * 1000; // 2 minutes in milliseconds

export async function generateVerificationToken(email: string): Promise<string> {
  const token = randomUUID();
  const expires = new Date(+Date.now() + VERIFICATION_TOKEN_EXPIRY);

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Create new verification token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

export async function verifyToken(
  token: string,
  email: string,
): Promise<boolean> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email,
        token,
      },
    },
  });

  if (!verificationToken) return false;

  // Check if token has expired
  if (verificationToken.expires < new Date()) {
    // Clean up expired token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    });
    return false;
  }

  // Token is valid - delete it (one-time use) and mark user as verified
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: email,
        token,
      },
    },
  });

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  return true;
}

export async function deleteVerificationTokens(email: string): Promise<void> {
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });
}