import "server-only";

import { randomBytes } from "crypto";
import type { MemberPlan, MemberUser, SubscriptionStatus } from "./member-auth";
import type { AccessLogEntry } from "./member-access-log";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export type MemberRole = "member" | "admin";
export type MemberAccountStatus = "active" | "disabled";

export interface StoredMemberUser extends MemberUser {
  role: MemberRole;
  accountStatus: MemberAccountStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  passwordHash?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  twoFactor?: {
    enabled: boolean;
    secret?: string;
    enabledAt?: string;
    setupExpiresAt?: string;
  };
}

export interface StoredMemberSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface StoredAdminAuditLog {
  id: string;
  actorEmail: string;
  action: string;
  targetUserId: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
}

export interface StoredRegistrationEvent {
  id: string;
  emailHash: string;
  domain: string;
  ip: string;
  userAgent: string;
  fingerprint: string;
  status: "success" | "blocked" | "failed";
  reason?: string;
  userId?: string;
  createdAt: string;
}

export interface StoredLoginEvent {
  id: string;
  emailHash: string;
  ip: string;
  userAgent: string;
  fingerprint: string;
  status: "success" | "blocked" | "failed";
  reason?: string;
  userId?: string;
  createdAt: string;
}

export interface StoredHumanChallenge {
  id: string;
  answerHash: string;
  ip: string;
  fingerprint: string;
  purpose: "register" | "login";
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

type DbUser = Prisma.MemberUserGetPayload<object>;
type DbSession = Prisma.MemberSessionGetPayload<object>;
type DbAccessLog = Prisma.MemberAccessLogGetPayload<object>;
type DbAuditLog = Prisma.MemberAdminAuditLogGetPayload<object>;
type DbRegistrationEvent = Prisma.MemberRegistrationEventGetPayload<object>;
type DbLoginEvent = Prisma.MemberLoginEventGetPayload<object>;
type DbHumanChallenge = Prisma.MemberHumanChallengeGetPayload<object>;

function iso(date?: Date | null) {
  return date ? date.toISOString() : undefined;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toStoredUser(user: DbUser): StoredMemberUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash ?? undefined,
    plan: user.plan as MemberPlan,
    role: user.role as MemberRole,
    accountStatus: user.accountStatus as MemberAccountStatus,
    subscription: {
      status: user.subscriptionStatus as SubscriptionStatus,
      renewsAt: iso(user.subscriptionRenewsAt),
    },
    emailVerified: user.emailVerified,
    emailVerifiedAt: iso(user.emailVerifiedAt),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: iso(user.lastLoginAt),
    twoFactor: {
      enabled: user.twoFactorEnabled,
      secret: user.twoFactorSecret ?? undefined,
      enabledAt: iso(user.twoFactorEnabledAt),
      setupExpiresAt: iso(user.twoFactorSetupExpiresAt),
    },
  };
}

function toStoredSession(session: DbSession): StoredMemberSession {
  return {
    id: session.id,
    userId: session.userId,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  };
}

function toStoredAccessLog(log: DbAccessLog): AccessLogEntry {
  return {
    action: log.action as AccessLogEntry["action"],
    userId: log.userId,
    targetId: log.targetId ?? undefined,
    createdAt: log.createdAt.toISOString(),
  };
}

function toStoredAuditLog(log: DbAuditLog): StoredAdminAuditLog {
  return {
    id: log.id,
    actorEmail: log.actorEmail,
    action: log.action,
    targetUserId: log.targetUserId,
    before: log.before ?? undefined,
    after: log.after ?? undefined,
    createdAt: log.createdAt.toISOString(),
  };
}

function toStoredRegistrationEvent(event: DbRegistrationEvent): StoredRegistrationEvent {
  return {
    id: event.id,
    emailHash: event.emailHash,
    domain: event.domain,
    ip: event.ip,
    userAgent: event.userAgent,
    fingerprint: event.fingerprint,
    status: event.status as StoredRegistrationEvent["status"],
    reason: event.reason ?? undefined,
    userId: event.userId ?? undefined,
    createdAt: event.createdAt.toISOString(),
  };
}

function toStoredLoginEvent(event: DbLoginEvent): StoredLoginEvent {
  return {
    id: event.id,
    emailHash: event.emailHash,
    ip: event.ip,
    userAgent: event.userAgent,
    fingerprint: event.fingerprint,
    status: event.status as StoredLoginEvent["status"],
    reason: event.reason ?? undefined,
    userId: event.userId ?? undefined,
    createdAt: event.createdAt.toISOString(),
  };
}

function toStoredHumanChallenge(challenge: DbHumanChallenge): StoredHumanChallenge {
  return {
    id: challenge.id,
    answerHash: challenge.answerHash,
    ip: challenge.ip,
    fingerprint: challenge.fingerprint,
    purpose: challenge.purpose as StoredHumanChallenge["purpose"],
    createdAt: challenge.createdAt.toISOString(),
    expiresAt: challenge.expiresAt.toISOString(),
    usedAt: iso(challenge.usedAt),
  };
}

function userUpdateData(input: Partial<StoredMemberUser>): Prisma.MemberUserUpdateInput {
  const data: Prisma.MemberUserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) {
    data.email = input.email;
    data.normalizedEmail = normalizeEmail(input.email);
  }
  if (input.passwordHash !== undefined) data.passwordHash = input.passwordHash;
  if (input.plan !== undefined) data.plan = input.plan;
  if (input.role !== undefined) data.role = input.role;
  if (input.accountStatus !== undefined) data.accountStatus = input.accountStatus;
  if (input.emailVerified !== undefined) data.emailVerified = input.emailVerified;
  if (input.emailVerifiedAt !== undefined) data.emailVerifiedAt = input.emailVerifiedAt ? new Date(input.emailVerifiedAt) : null;
  if (input.lastLoginAt !== undefined) data.lastLoginAt = input.lastLoginAt ? new Date(input.lastLoginAt) : null;
  if (input.subscription?.status !== undefined) data.subscriptionStatus = input.subscription.status;
  if (input.subscription && "renewsAt" in input.subscription) {
    data.subscriptionRenewsAt = input.subscription.renewsAt ? new Date(input.subscription.renewsAt) : null;
  }
  if (input.twoFactor) {
    if (input.twoFactor.enabled !== undefined) data.twoFactorEnabled = input.twoFactor.enabled;
    if ("secret" in input.twoFactor) data.twoFactorSecret = input.twoFactor.secret ?? null;
    if ("enabledAt" in input.twoFactor) data.twoFactorEnabledAt = input.twoFactor.enabledAt ? new Date(input.twoFactor.enabledAt) : null;
    if ("setupExpiresAt" in input.twoFactor) data.twoFactorSetupExpiresAt = input.twoFactor.setupExpiresAt ? new Date(input.twoFactor.setupExpiresAt) : null;
  }
  return data;
}

export async function getStoredUsers(): Promise<StoredMemberUser[]> {
  const users = await prisma.memberUser.findMany({ orderBy: { createdAt: "desc" } });
  return users.map(toStoredUser);
}

export async function getStoredUserById(id: string): Promise<StoredMemberUser | null> {
  const user = await prisma.memberUser.findUnique({ where: { id } });
  return user ? toStoredUser(user) : null;
}

export async function getStoredUserByEmail(email: string): Promise<StoredMemberUser | null> {
  const user = await prisma.memberUser.findUnique({ where: { normalizedEmail: normalizeEmail(email) } });
  return user ? toStoredUser(user) : null;
}

export async function createStoredUser(input: {
  name: string;
  email: string;
  passwordHash?: string;
  plan?: MemberPlan;
  status?: SubscriptionStatus;
  emailVerified?: boolean;
}) {
  try {
    const now = new Date();
    const user = await prisma.memberUser.create({
      data: {
        id: `user_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
        name: input.name,
        email: input.email,
        normalizedEmail: normalizeEmail(input.email),
        passwordHash: input.passwordHash,
        plan: input.plan ?? "free",
        role: "member",
        accountStatus: "active",
        subscriptionStatus: input.status ?? "inactive",
        emailVerified: input.emailVerified ?? false,
        emailVerifiedAt: input.emailVerified ? now : null,
        createdAt: now,
        updatedAt: now,
      },
    });
    return toStoredUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }
}

export async function updateStoredUser(
  id: string,
  updater: Partial<StoredMemberUser> | ((user: StoredMemberUser) => StoredMemberUser),
) {
  const current = await getStoredUserById(id);
  if (!current) return null;
  const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  const user = await prisma.memberUser.update({
    where: { id },
    data: userUpdateData(next),
  });
  return toStoredUser(user);
}

export async function getStoredSessions(): Promise<StoredMemberSession[]> {
  const sessions = await prisma.memberSession.findMany({ orderBy: { createdAt: "desc" } });
  return sessions.map(toStoredSession);
}

export async function createStoredSession(userId: string) {
  const now = new Date();
  const session = await prisma.$transaction(async (tx) => {
    await tx.memberSession.deleteMany({ where: { expiresAt: { lte: now } } });
    return tx.memberSession.create({
      data: {
        id: `sess_${randomBytes(32).toString("hex")}`,
        userId,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
      },
    });
  });
  return toStoredSession(session);
}

export async function getStoredSessionById(id: string): Promise<StoredMemberSession | null> {
  const session = await prisma.memberSession.findUnique({ where: { id } });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await deleteStoredSession(id);
    return null;
  }
  return toStoredSession(session);
}

export async function deleteStoredSession(id: string) {
  await prisma.memberSession.deleteMany({ where: { id } });
}

export async function deleteStoredSessionsByUserId(userId: string) {
  await prisma.memberSession.deleteMany({ where: { userId } });
}

export async function getStoredAccessLogs(): Promise<AccessLogEntry[]> {
  const logs = await prisma.memberAccessLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return logs.map(toStoredAccessLog);
}

export async function appendStoredAccessLog(entry: AccessLogEntry) {
  await prisma.memberAccessLog.create({
    data: {
      id: `access_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`,
      action: entry.action,
      userId: entry.userId,
      targetId: entry.targetId,
      createdAt: new Date(entry.createdAt),
    },
  });
}

export async function getStoredAdminAuditLogs(): Promise<StoredAdminAuditLog[]> {
  const logs = await prisma.memberAdminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return logs.map(toStoredAuditLog);
}

export async function appendStoredAdminAuditLog(entry: Omit<StoredAdminAuditLog, "id" | "createdAt">) {
  const auditLog = await prisma.memberAdminAuditLog.create({
    data: {
      id: `audit_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
      actorEmail: entry.actorEmail,
      action: entry.action,
      targetUserId: entry.targetUserId,
      before: entry.before as Prisma.InputJsonValue | undefined,
      after: entry.after as Prisma.InputJsonValue | undefined,
    },
  });
  return toStoredAuditLog(auditLog);
}

export async function getStoredRegistrationEvents() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const events = await prisma.memberRegistrationEvent.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" } });
  return events.map(toStoredRegistrationEvent);
}

export async function appendStoredRegistrationEvent(entry: Omit<StoredRegistrationEvent, "id" | "createdAt">) {
  const now = new Date();
  const event = await prisma.$transaction(async (tx) => {
    await tx.memberRegistrationEvent.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7) } } });
    return tx.memberRegistrationEvent.create({
      data: {
        id: `reg_${now.getTime().toString(36)}_${randomBytes(3).toString("hex")}`,
        emailHash: entry.emailHash,
        domain: entry.domain,
        ip: entry.ip,
        userAgent: entry.userAgent,
        fingerprint: entry.fingerprint,
        status: entry.status,
        reason: entry.reason,
        userId: entry.userId,
        createdAt: now,
      },
    });
  });
  return toStoredRegistrationEvent(event);
}

export async function getStoredLoginEvents() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const events = await prisma.memberLoginEvent.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" } });
  return events.map(toStoredLoginEvent);
}

export async function appendStoredLoginEvent(entry: Omit<StoredLoginEvent, "id" | "createdAt">) {
  const now = new Date();
  const event = await prisma.$transaction(async (tx) => {
    await tx.memberLoginEvent.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7) } } });
    return tx.memberLoginEvent.create({
      data: {
        id: `login_${now.getTime().toString(36)}_${randomBytes(3).toString("hex")}`,
        emailHash: entry.emailHash,
        ip: entry.ip,
        userAgent: entry.userAgent,
        fingerprint: entry.fingerprint,
        status: entry.status,
        reason: entry.reason,
        userId: entry.userId,
        createdAt: now,
      },
    });
  });
  return toStoredLoginEvent(event);
}

export async function getStoredHumanChallenges() {
  const challenges = await prisma.memberHumanChallenge.findMany({ orderBy: { createdAt: "desc" } });
  return challenges.map(toStoredHumanChallenge);
}

export async function createStoredHumanChallenge(entry: Omit<StoredHumanChallenge, "id" | "createdAt" | "expiresAt">) {
  const now = new Date();
  const challenge = await prisma.$transaction(async (tx) => {
    await tx.memberHumanChallenge.deleteMany({ where: { OR: [{ expiresAt: { lte: now } }, { usedAt: { not: null } }] } });
    return tx.memberHumanChallenge.create({
      data: {
        id: `hc_${now.getTime().toString(36)}_${randomBytes(8).toString("hex")}`,
        answerHash: entry.answerHash,
        ip: entry.ip,
        fingerprint: entry.fingerprint,
        purpose: entry.purpose,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      },
    });
  });
  return toStoredHumanChallenge(challenge);
}

export async function consumeStoredHumanChallenge(id: string): Promise<StoredHumanChallenge | null> {
  const now = new Date();
  const challenge = await prisma.$transaction(async (tx) => {
    const current = await tx.memberHumanChallenge.findFirst({
      where: { id, usedAt: null, expiresAt: { gt: now } },
    });
    if (!current) return null;

    const consumed = await tx.memberHumanChallenge.updateMany({
      where: { id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return null;

    await tx.memberHumanChallenge.deleteMany({ where: { expiresAt: { lte: now } } });
    return current;
  });
  return challenge ? toStoredHumanChallenge(challenge) : null;
}
