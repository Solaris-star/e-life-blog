import "server-only";

import { createHash, randomBytes } from "crypto";
import type { MemberAccountTokenType, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type AccountTokenType = "email_verify" | "password_reset" | "email_change";

const tokenTtlMs: Record<AccountTokenType, number> = {
  email_verify: 1000 * 60 * 60 * 24,
  password_reset: 1000 * 60 * 30,
  email_change: 1000 * 60 * 30,
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createMemberAccountToken(input: {
  type: AccountTokenType;
  userId?: string;
  email?: string;
  payload?: Record<string, unknown>;
}) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const record = await prisma.memberAccountToken.create({
    data: {
      id: `tok_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`,
      type: input.type as MemberAccountTokenType,
      userId: input.userId,
      email: input.email?.trim().toLowerCase(),
      tokenHash: hashToken(token),
      payload: input.payload as Prisma.InputJsonValue | undefined,
      createdAt: now,
      expiresAt: new Date(now.getTime() + tokenTtlMs[input.type]),
    },
  });
  return { token, record };
}

export async function consumeMemberAccountToken(type: AccountTokenType, token: string) {
  const now = new Date();
  const tokenHash = hashToken(token);
  const record = await prisma.$transaction(async (tx) => {
    const current = await tx.memberAccountToken.findFirst({
      where: { tokenHash, type: type as MemberAccountTokenType, usedAt: null, expiresAt: { gt: now } },
    });
    if (!current) return null;

    const consumed = await tx.memberAccountToken.updateMany({
      where: { id: current.id, tokenHash, type: type as MemberAccountTokenType, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return null;

    await tx.memberAccountToken.deleteMany({
      where: { OR: [{ expiresAt: { lte: now } }, { usedAt: { not: null } }] },
    });
    return current;
  });
  return record;
}
