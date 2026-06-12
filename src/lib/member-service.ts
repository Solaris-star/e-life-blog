import "server-only";

import { headers } from "next/headers";
import { createMemberSession, createTwoFactorChallenge } from "./member-auth";
import { getCloudflareAccessIdentity } from "./cloudflare-access";
import {
  appendStoredAdminAuditLog,
  createStoredUser,
  deleteStoredSessionsByUserId,
  getStoredSessionById,
  getStoredSessions,
  getStoredUserByEmail,
  getStoredUserById,
  updateStoredUser,
  type MemberAccountStatus,
  type StoredMemberUser,
} from "./member-store";
import { hashPassword, verifyPassword } from "./password";
import {
  evaluateRegistrationRisk,
  getRegistrationRequestMeta,
  recordRegistrationAttempt,
  type RegistrationRiskReason,
} from "./member-registration-security";
import {
  evaluateLoginRisk,
  getLoginRequestMeta,
  recordLoginAttempt,
  type LoginRiskReason,
} from "./member-login-security";
import { shouldChallengeLogin, shouldChallengeRegistration, verifyHumanChallenge } from "./member-human-challenge";
import { createMemberAccountToken, consumeMemberAccountToken } from "./member-account-tokens";
import { buildMemberUrl, sendMemberEmail } from "./member-email";
import type { MemberPlan, SubscriptionStatus } from "./member-auth";

export type RegisterMemberResult =
  | { ok: true; user: StoredMemberUser; verificationEmail: "sent" | "not_configured" | "rate_limited" }
  | { ok: false; error: "invalid" | "exists" | "human_challenge_required" | RegistrationRiskReason };

export type LoginMemberResult =
  | { ok: true; user: StoredMemberUser }
  | { ok: false; error: "missing" | "invalid" | "disabled" | "human_challenge_required" | LoginRiskReason }
  | { ok: false; error: "two_factor_required"; nextPath: string };

export type OAuthLoginMemberResult =
  | { ok: true; user: StoredMemberUser }
  | { ok: false; error: "invalid" | "disabled" | RegistrationRiskReason }
  | { ok: false; error: "two_factor_required" };

export async function registerMember(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  website?: string;
  humanAnswer?: string;
  humanChallengeId?: string;
  turnstileToken?: string;
}): Promise<RegisterMemberResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const meta = await getRegistrationRequestMeta();

  if (
    name.length < 2 ||
    name.length > 32 ||
    !email.includes("@") ||
    input.password.length < 8 ||
    input.password !== input.confirmPassword
  ) {
    await recordRegistrationAttempt({ email, meta, status: "failed", reason: "invalid" });
    return { ok: false, error: "invalid" };
  }

  const risk = await evaluateRegistrationRisk({ email, meta, honeypot: input.website });
  if (!risk.allowed) {
    await recordRegistrationAttempt({ email, meta, status: "blocked", reason: risk.reason });
    return { ok: false, error: risk.reason };
  }

  if (await shouldChallengeRegistration(meta)) {
    const passed = await verifyHumanChallenge({ purpose: "register", challengeId: input.humanChallengeId ?? "", answer: input.humanAnswer ?? "", turnstileToken: input.turnstileToken ?? "", meta });
    if (!passed) {
      await recordRegistrationAttempt({ email, meta, status: "blocked", reason: "human_challenge_required" });
      return { ok: false, error: "human_challenge_required" };
    }
  }

  const user = await createStoredUser({
    name,
    email,
    passwordHash: await hashPassword(input.password),
    plan: "free",
    status: "inactive",
  });

  if (!user) {
    await recordRegistrationAttempt({ email, meta, status: "failed", reason: "exists" });
    return { ok: false, error: "exists" };
  }
  await recordRegistrationAttempt({ email, meta, status: "success", user });
  const verificationEmail = await sendEmailVerification(user.id);
  await createMemberSession(user.id);
  return { ok: true, user, verificationEmail };
}

export async function loginMember(input: { email: string; password: string; nextPath?: string; humanAnswer?: string; humanChallengeId?: string; turnstileToken?: string }): Promise<LoginMemberResult> {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const meta = await getLoginRequestMeta();

  if (!email || !password) {
    await recordLoginAttempt({ email, meta, status: "failed", reason: "missing" });
    return { ok: false, error: "missing" };
  }

  if (await shouldChallengeLogin(meta)) {
    const passed = await verifyHumanChallenge({ purpose: "login", challengeId: input.humanChallengeId ?? "", answer: input.humanAnswer ?? "", turnstileToken: input.turnstileToken ?? "", meta });
    if (!passed) {
      await recordLoginAttempt({ email, meta, status: "blocked", reason: "human_challenge_required" });
      return { ok: false, error: "human_challenge_required" };
    }
  }

  const risk = await evaluateLoginRisk({ email, meta });
  if (!risk.allowed) {
    await recordLoginAttempt({ email, meta, status: "blocked", reason: risk.reason });
    return { ok: false, error: risk.reason };
  }

  const user = await getStoredUserByEmail(email);
  const passwordOk = await verifyPassword(password, user?.passwordHash);
  if (!user || !passwordOk) {
    await recordLoginAttempt({ email, meta, status: "failed", reason: "invalid", userId: user?.id });
    return { ok: false, error: "invalid" };
  }

  if (user.accountStatus === "disabled") {
    await recordLoginAttempt({ email, meta, status: "failed", reason: "disabled", userId: user.id });
    return { ok: false, error: "disabled" };
  }

  const updatedUser = await updateStoredUser(user.id, { lastLoginAt: new Date().toISOString() });
  await recordLoginAttempt({ email, meta, status: "success", userId: user.id });
  const resolvedUser = updatedUser ?? user;
  if (resolvedUser.twoFactor?.enabled && resolvedUser.twoFactor.secret) {
    await createTwoFactorChallenge(resolvedUser.id, input.nextPath ?? "");
    return { ok: false, error: "two_factor_required", nextPath: input.nextPath ?? "" };
  }
  await createMemberSession(resolvedUser.id);
  return { ok: true, user: resolvedUser };
}

export async function loginOrRegisterOAuthMember(input: {
  email: string;
  name: string;
  provider: "google" | "github";
}): Promise<OAuthLoginMemberResult> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim() || email.split("@")[0] || "Member";
  const meta = await getRegistrationRequestMeta();

  if (!email.includes("@")) {
    await recordRegistrationAttempt({ email, meta, status: "failed", reason: "invalid" });
    return { ok: false, error: "invalid" };
  }

  let user = await getStoredUserByEmail(email);
  if (user) {
    if (user.accountStatus === "disabled") {
      await recordLoginAttempt({ email, meta, status: "failed", reason: "disabled", userId: user.id });
      return { ok: false, error: "disabled" };
    }
    user = (await updateStoredUser(user.id, { lastLoginAt: new Date().toISOString() })) ?? user;
    await recordLoginAttempt({ email, meta, status: "success", reason: `oauth_${input.provider}`, userId: user.id });
    if (user.twoFactor?.enabled && user.twoFactor.secret) {
      await createTwoFactorChallenge(user.id);
      return { ok: false, error: "two_factor_required" };
    }
    await createMemberSession(user.id);
    return { ok: true, user };
  }

  const risk = await evaluateRegistrationRisk({ email, meta });
  if (!risk.allowed) {
    await recordRegistrationAttempt({ email, meta, status: "blocked", reason: risk.reason });
    return { ok: false, error: risk.reason };
  }

  user = await createStoredUser({
    name,
    email,
    passwordHash: undefined,
    plan: "free",
    status: "inactive",
    emailVerified: true,
  });
  if (!user) {
    await recordRegistrationAttempt({ email, meta, status: "failed", reason: "exists" });
    return { ok: false, error: "invalid" };
  }

  await recordRegistrationAttempt({ email, meta, status: "success", reason: `oauth_${input.provider}`, user });
  await createMemberSession(user.id);
  return { ok: true, user };
}

export async function setMemberAccountStatus(input: {
  userId: string;
  accountStatus: MemberAccountStatus;
  actorEmail?: string;
}) {
  const before = await getStoredUserById(input.userId);
  if (!before) return null;

  const after = await updateStoredUser(input.userId, { accountStatus: input.accountStatus });
  if (input.accountStatus === "disabled") {
    await deleteStoredSessionsByUserId(input.userId);
  }

  await auditAdminChange({
    actorEmail: input.actorEmail,
    action: input.accountStatus === "disabled" ? "disable_user" : "enable_user",
    targetUserId: input.userId,
    before: compactUserState(before),
    after: compactUserState(after),
  });

  return after;
}

export async function setMemberSubscription(input: {
  userId: string;
  plan: MemberPlan;
  status: SubscriptionStatus;
  renewsAt?: string;
  actorEmail?: string;
}) {
  const before = await getStoredUserById(input.userId);
  if (!before) return null;

  const normalizedSubscription = normalizeSubscriptionUpdate({
    currentRenewsAt: before.subscription.renewsAt,
    plan: input.plan,
    status: input.status,
    renewsAt: input.renewsAt,
  });

  const after = await updateStoredUser(input.userId, (user) => ({
    ...user,
    plan: input.plan,
    subscription: normalizedSubscription,
  }));

  await auditAdminChange({
    actorEmail: input.actorEmail,
    action: "set_subscription",
    targetUserId: input.userId,
    before: compactUserState(before),
    after: compactUserState(after),
  });

  return after;
}

export async function kickMemberSessions(input: { userId: string; actorEmail?: string }) {
  const beforeSessions = await getStoredSessions();
  const userSessions = beforeSessions.filter((session) => session.userId === input.userId);
  await deleteStoredSessionsByUserId(input.userId);
  await auditAdminChange({
    actorEmail: input.actorEmail,
    action: "kick_sessions",
    targetUserId: input.userId,
    before: { sessions: userSessions.length },
    after: { sessions: 0 },
  });
  return userSessions.length;
}

export async function getActiveSessionsForUser(userId: string) {
  const sessions = await getStoredSessions();
  const active = [];
  for (const session of sessions.filter((item) => item.userId === userId)) {
    const resolved = await getStoredSessionById(session.id);
    if (resolved) active.push(resolved);
  }
  return active;
}

export async function getAdminActorEmail() {
  const headerStore = await headers();
  const identity = await getCloudflareAccessIdentity(headerStore);
  return identity?.email ?? "local-admin";
}

export async function sendEmailVerification(userId: string): Promise<"sent" | "not_configured" | "rate_limited"> {
  const user = await getStoredUserById(userId);
  if (!user || user.emailVerified) return "sent";
  
  // 检查速率限制
  const { checkEmailRateLimit, recordEmailSent } = await import("./member-email-rate-limit");
  const rateCheck = await checkEmailRateLimit(user.email, "verify");
  if (!rateCheck.allowed) {
    return "rate_limited";
  }
  
  const { token } = await createMemberAccountToken({
    type: "email_verify",
    userId: user.id,
    email: user.email,
  });
  
  const result = await sendMemberEmail({
    to: user.email,
    kind: "verify",
    url: buildMemberUrl("/verify-email", token),
  });
  
  if (result === "sent") {
    await recordEmailSent(user.email, "verify");
  }
  
  return result;
}

export async function verifyMemberEmail(token: string) {
  const record = await consumeMemberAccountToken("email_verify", token);
  if (!record?.userId) return false;
  const updated = await updateStoredUser(record.userId, {
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
  });
  return Boolean(updated);
}

export async function requestPasswordReset(emailInput: string): Promise<boolean | "rate_limited"> {
  const email = normalizeEmail(emailInput);
  const user = await getStoredUserByEmail(email);
  if (!user || user.accountStatus === "disabled") return true;
  
  // 检查速率限制
  const { checkEmailRateLimit, recordEmailSent } = await import("./member-email-rate-limit");
  const rateCheck = await checkEmailRateLimit(user.email, "password_reset");
  if (!rateCheck.allowed) {
    return "rate_limited";
  }
  
  const { token } = await createMemberAccountToken({
    type: "password_reset",
    userId: user.id,
    email: user.email,
  });
  
  const result = await sendMemberEmail({
    to: user.email,
    kind: "password_reset",
    url: buildMemberUrl("/reset-password", token),
  });
  
  if (result === "sent") {
    await recordEmailSent(user.email, "password_reset");
  }
  
  return true;
}

export async function resetMemberPassword(input: { token: string; password: string; confirmPassword: string }) {
  if (input.password.length < 8 || input.password !== input.confirmPassword) return false;
  const record = await consumeMemberAccountToken("password_reset", input.token);
  if (!record?.userId) return false;
  const updated = await updateStoredUser(record.userId, {
    passwordHash: await hashPassword(input.password),
  });
  if (!updated) return false;
  await deleteStoredSessionsByUserId(updated.id);
  return true;
}

export async function changeMemberPassword(input: { userId: string; currentPassword: string; password: string; confirmPassword: string }) {
  if (input.password.length < 8 || input.password !== input.confirmPassword) return { ok: false as const, error: "invalid" as const };
  const user = await getStoredUserById(input.userId);
  if (!user) return { ok: false as const, error: "invalid" as const };
  const hasPassword = Boolean(user.passwordHash);
  if (hasPassword && !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    return { ok: false as const, error: "current_password" as const };
  }
  const updated = await updateStoredUser(user.id, { passwordHash: await hashPassword(input.password) });
  if (!updated) return { ok: false as const, error: "invalid" as const };
  await deleteStoredSessionsByUserId(user.id);
  await createMemberSession(user.id);
  return { ok: true as const };
}

export async function requestMemberEmailChange(input: { userId: string; newEmail: string; currentPassword: string }) {
  const newEmail = normalizeEmail(input.newEmail);
  if (!newEmail.includes("@")) return { ok: false as const, error: "invalid" as const };
  const user = await getStoredUserById(input.userId);
  if (!user) return { ok: false as const, error: "invalid" as const };
  if (user.passwordHash && !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    return { ok: false as const, error: "current_password" as const };
  }
  const existing = await getStoredUserByEmail(newEmail);
  if (existing && existing.id !== user.id) return { ok: false as const, error: "exists" as const };
  const { token } = await createMemberAccountToken({
    type: "email_change",
    userId: user.id,
    email: newEmail,
    payload: { newEmail },
  });
  await sendMemberEmail({
    to: newEmail,
    kind: "email_change",
    url: buildMemberUrl("/verify-email-change", token),
  });
  return { ok: true as const };
}

export async function confirmMemberEmailChange(token: string) {
  const record = await consumeMemberAccountToken("email_change", token);
  const payload = record?.payload as { newEmail?: string } | null;
  const newEmail = normalizeEmail(payload?.newEmail ?? record?.email ?? "");
  if (!record?.userId || !newEmail.includes("@")) return { ok: false as const, error: "invalid" as const };
  const existing = await getStoredUserByEmail(newEmail);
  if (existing && existing.id !== record.userId) return { ok: false as const, error: "exists" as const };
  const updated = await updateStoredUser(record.userId, {
    email: newEmail,
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
  });
  if (!updated) return { ok: false as const, error: "invalid" as const };
  await deleteStoredSessionsByUserId(updated.id);
  return { ok: true as const };
}

async function auditAdminChange(input: {
  actorEmail?: string;
  action: string;
  targetUserId: string;
  before?: unknown;
  after?: unknown;
}) {
  await appendStoredAdminAuditLog({
    actorEmail: input.actorEmail ?? (await getAdminActorEmail()),
    action: input.action,
    targetUserId: input.targetUserId,
    before: input.before,
    after: input.after,
  });
}

function normalizeSubscriptionUpdate(input: {
  currentRenewsAt?: string;
  plan: MemberPlan;
  status: SubscriptionStatus;
  renewsAt?: string;
}) {
  const normalizedRenewsAt = input.renewsAt?.trim();
  if (input.plan === "lifetime" || input.status !== "active") {
    return { status: input.status, renewsAt: undefined };
  }

  const fallbackRenewsAt = input.currentRenewsAt && new Date(input.currentRenewsAt).getTime() > Date.now()
    ? input.currentRenewsAt
    : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

  return {
    status: input.status,
    renewsAt: normalizedRenewsAt || fallbackRenewsAt,
  };
}

function compactUserState(user: StoredMemberUser | null) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    accountStatus: user.accountStatus,
    plan: user.plan,
    subscription: user.subscription,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
