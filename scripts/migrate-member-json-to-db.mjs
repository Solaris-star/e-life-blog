import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), "member-private", "data");

function readJson(name) {
  const filePath = path.join(dataDir, name);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw.trim() ? JSON.parse(raw) : [];
}

function date(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function main() {
  const users = readJson("users.json");
  const sessions = readJson("sessions.json");
  const accessLogs = readJson("access-logs.json");
  const auditLogs = readJson("admin-audit-logs.json");
  const registrationEvents = readJson("registration-events.json");
  const loginEvents = readJson("login-events.json");
  const humanChallenges = readJson("human-challenges.json");
  const postActivities = readJson("post-activity.json");
  const redeemCodes = readJson("redeem-codes.json");

  for (const user of users) {
    await prisma.memberUser.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        normalizedEmail: normalizeEmail(user.email),
        emailVerified: Boolean(user.emailVerified),
        emailVerifiedAt: date(user.emailVerifiedAt),
        passwordHash: user.passwordHash,
        plan: user.plan || "free",
        role: user.role || "member",
        accountStatus: user.accountStatus || "active",
        subscriptionStatus: user.subscription?.status || "inactive",
        subscriptionRenewsAt: date(user.subscription?.renewsAt),
        lastLoginAt: date(user.lastLoginAt),
        twoFactorEnabled: Boolean(user.twoFactor?.enabled),
        twoFactorSecret: user.twoFactor?.secret,
        twoFactorEnabledAt: date(user.twoFactor?.enabledAt),
        twoFactorSetupExpiresAt: date(user.twoFactor?.setupExpiresAt),
        createdAt: date(user.createdAt) || new Date(),
        updatedAt: date(user.updatedAt) || new Date(),
      },
    });
  }

  for (const session of sessions) {
    if (!users.some((user) => user.id === session.userId)) continue;
    await prisma.memberSession.upsert({
      where: { id: session.id },
      update: {},
      create: {
        id: session.id,
        userId: session.userId,
        createdAt: date(session.createdAt) || new Date(),
        expiresAt: date(session.expiresAt) || new Date(),
      },
    });
  }

  for (const log of accessLogs) {
    const id = log.id || `access_${Buffer.from(`${log.userId || "guest"}:${log.action || ""}:${log.targetId || ""}:${log.createdAt || ""}`).toString("base64url").slice(0, 32)}`;
    if (!log.userId || !log.action) continue;
    await prisma.memberAccessLog.upsert({
      where: { id },
      update: {},
      create: {
        id,
        action: log.action,
        userId: log.userId,
        targetId: log.targetId,
        createdAt: date(log.createdAt) || new Date(),
      },
    });
  }

  for (const log of auditLogs) {
    await prisma.memberAdminAuditLog.upsert({
      where: { id: log.id },
      update: {},
      create: {
        id: log.id,
        actorEmail: log.actorEmail || "unknown",
        action: log.action || "unknown",
        targetUserId: log.targetUserId || "",
        before: log.before,
        after: log.after,
        createdAt: date(log.createdAt) || new Date(),
      },
    });
  }

  for (const event of registrationEvents) {
    await prisma.memberRegistrationEvent.upsert({
      where: { id: event.id },
      update: {},
      create: {
        id: event.id,
        emailHash: event.emailHash || "",
        domain: event.domain || "",
        ip: event.ip || "",
        userAgent: event.userAgent || "",
        fingerprint: event.fingerprint || "",
        status: event.status || "failed",
        reason: event.reason,
        userId: users.some((user) => user.id === event.userId) ? event.userId : undefined,
        createdAt: date(event.createdAt) || new Date(),
      },
    });
  }

  for (const event of loginEvents) {
    await prisma.memberLoginEvent.upsert({
      where: { id: event.id },
      update: {},
      create: {
        id: event.id,
        emailHash: event.emailHash || "",
        ip: event.ip || "",
        userAgent: event.userAgent || "",
        fingerprint: event.fingerprint || "",
        status: event.status || "failed",
        reason: event.reason,
        userId: users.some((user) => user.id === event.userId) ? event.userId : undefined,
        createdAt: date(event.createdAt) || new Date(),
      },
    });
  }

  for (const challenge of humanChallenges) {
    await prisma.memberHumanChallenge.upsert({
      where: { id: challenge.id },
      update: {},
      create: {
        id: challenge.id,
        answerHash: challenge.answerHash || "",
        ip: challenge.ip || "",
        fingerprint: challenge.fingerprint || "",
        purpose: challenge.purpose || "login",
        createdAt: date(challenge.createdAt) || new Date(),
        expiresAt: date(challenge.expiresAt) || new Date(),
        usedAt: date(challenge.usedAt),
      },
    });
  }

  for (const activity of postActivities) {
    if (!users.some((user) => user.id === activity.userId)) continue;
    await prisma.memberPostActivity.upsert({
      where: { userId_slug_type: { userId: activity.userId, slug: activity.slug, type: activity.type } },
      update: {},
      create: {
        id: activity.id,
        userId: activity.userId,
        slug: activity.slug,
        type: activity.type,
        createdAt: date(activity.createdAt) || new Date(),
        updatedAt: date(activity.updatedAt) || new Date(),
        lastReadAt: date(activity.lastReadAt),
        readCount: activity.readCount,
      },
    });
  }

  for (const code of redeemCodes) {
    await prisma.memberRedeemCode.upsert({
      where: { code: String(code.code || "").trim().toUpperCase() },
      update: {},
      create: {
        code: String(code.code || "").trim().toUpperCase(),
        plan: code.plan,
        status: code.status === "used" ? "used" : "active",
        createdBy: code.createdBy || "migration",
        createdAt: date(code.createdAt) || new Date(),
        expiresAt: date(code.expiresAt),
        usedBy: users.some((user) => user.id === code.usedBy) ? code.usedBy : undefined,
        usedAt: date(code.usedAt),
      },
    });
  }

  console.log(JSON.stringify({
    users: users.length,
    sessions: sessions.length,
    accessLogs: accessLogs.length,
    auditLogs: auditLogs.length,
    registrationEvents: registrationEvents.length,
    loginEvents: loginEvents.length,
    humanChallenges: humanChallenges.length,
    postActivities: postActivities.length,
    redeemCodes: redeemCodes.length,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
