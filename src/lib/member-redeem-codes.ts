import "server-only";

import { randomBytes } from "crypto";
import type { MemberPlan } from "./member-auth";
import { updateStoredUser } from "./member-store";
import { prisma } from "./prisma";

export type RedeemCodeStatus = "unused" | "used" | "expired";

export interface StoredRedeemCode {
  id: string;
  code: string;
  plan: Exclude<MemberPlan, "free">;
  status: RedeemCodeStatus;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  membershipExpiresAt?: string;
  usedBy?: string;
  usedAt?: string;
}

const paidPlans: StoredRedeemCode["plan"][] = ["basic", "pro", "lifetime"];
const defaultCodeTtlMs = 1000 * 60 * 60 * 24 * 7;
const defaultMembershipTtlMs = 1000 * 60 * 60 * 24 * 30;

function toStoredRedeemCode(code: Awaited<ReturnType<typeof prisma.memberRedeemCode.findFirst>> extends infer T ? NonNullable<T> : never): StoredRedeemCode {
  return {
    id: code.code,
    code: code.code,
    plan: code.plan as StoredRedeemCode["plan"],
    status: code.status === "used" ? "used" : code.status === "expired" ? "expired" : "unused",
    createdBy: code.createdBy,
    createdAt: code.createdAt.toISOString(),
    expiresAt: code.expiresAt?.toISOString(),
    membershipExpiresAt: code.membershipExpiresAt?.toISOString(),
    usedBy: code.usedBy ?? undefined,
    usedAt: code.usedAt?.toISOString(),
  };
}

export async function getRedeemCodes(): Promise<StoredRedeemCode[]> {
  await expireStaleRedeemCodes();
  const codes = await prisma.memberRedeemCode.findMany({ orderBy: { createdAt: "desc" } });
  return codes.map(toStoredRedeemCode);
}

export async function createRedeemCode(input: {
  plan: string;
  createdBy: string;
  expiresAt?: string;
  membershipExpiresAt?: string;
}) {
  if (!paidPlans.includes(input.plan as StoredRedeemCode["plan"])) return null;
  const plan = input.plan as StoredRedeemCode["plan"];
  const now = Date.now();
  const membershipExpiresAt = plan === "lifetime"
    ? null
    : parseDateInput(input.membershipExpiresAt) ?? new Date(now + defaultMembershipTtlMs);

  if (plan !== "lifetime" && (!membershipExpiresAt || membershipExpiresAt.getTime() <= now)) {
    return null;
  }

  const code = await prisma.memberRedeemCode.create({
    data: {
      code: generateRedeemCode(),
      plan,
      status: "active",
      createdBy: input.createdBy,
      expiresAt: parseDateInput(input.expiresAt) ?? new Date(now + defaultCodeTtlMs),
      ...(membershipExpiresAt ? { membershipExpiresAt } : {}),
    },
  });
  return toStoredRedeemCode(code);
}

export async function redeemMembershipCode(input: { userId: string; code: string }) {
  const normalizedCode = normalizeCode(input.code);
  if (!normalizedCode) return { ok: false as const, error: "invalid" as const };

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const code = await tx.memberRedeemCode.findUnique({ where: { code: normalizedCode } });
    if (!code) return { ok: false as const, error: "not_found" as const };
    if (code.status === "used") return { ok: false as const, error: "used" as const };
    if (code.status === "expired" || (code.expiresAt && code.expiresAt.getTime() <= now.getTime())) {
      await tx.memberRedeemCode.updateMany({
        where: { code: normalizedCode, status: "active" },
        data: { status: "expired" },
      });
      return { ok: false as const, error: "expired" as const };
    }
    if (code.plan !== "lifetime" && (!code.membershipExpiresAt || code.membershipExpiresAt.getTime() <= now.getTime())) {
      await tx.memberRedeemCode.updateMany({
        where: { code: normalizedCode, status: "active" },
        data: { status: "expired" },
      });
      return { ok: false as const, error: "expired" as const };
    }

    const consumed = await tx.memberRedeemCode.updateMany({
      where: { code: normalizedCode, status: "active", usedAt: null, usedBy: null },
      data: { status: "used", usedBy: input.userId, usedAt: now },
    });
    if (consumed.count !== 1) return { ok: false as const, error: "used" as const };

    return {
      ok: true as const,
      plan: code.plan as StoredRedeemCode["plan"],
      membershipExpiresAt: code.membershipExpiresAt?.toISOString(),
    };
  });

  if (!result.ok) return result;

  const updatedUser = await updateStoredUser(input.userId, (user) => ({
    ...user,
    plan: result.plan,
    subscription: {
      status: "active",
      ...(result.plan === "lifetime" ? { renewsAt: undefined } : { renewsAt: result.membershipExpiresAt }),
    },
  }));
  if (!updatedUser) return { ok: false as const, error: "invalid" as const };

  const usedCode = await prisma.memberRedeemCode.findUnique({ where: { code: normalizedCode } });
  if (!usedCode) return { ok: false as const, error: "invalid" as const };
  return { ok: true as const, code: toStoredRedeemCode(usedCode), user: updatedUser };
}

async function expireStaleRedeemCodes() {
  await prisma.memberRedeemCode.updateMany({
    where: {
      status: "active",
      expiresAt: { lte: new Date() },
    },
    data: { status: "expired" },
  });
}

function generateRedeemCode() {
  return `ELIFE-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function parseDateInput(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}
