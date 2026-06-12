import "server-only";

import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { createStoredSession, deleteStoredSession, getStoredSessionById, getStoredUserById, type MemberRole } from "./member-store";
import { verifyTotpToken } from "./member-2fa";
import { isMemberAdminEnabled } from "./member-feature-flags";
import { ADMIN_HOST, getCloudflareAccessIdentity, isLocalAdminHost, normalizeHost } from "./cloudflare-access";
import { requireProductionSecret } from "./request-security";

export type SubscriptionStatus = "active" | "inactive" | "past_due" | "expired";
export type MemberPlan = "free" | "basic" | "pro" | "lifetime";

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  plan: MemberPlan;
  accountStatus?: "active" | "disabled";
  subscription: {
    status: SubscriptionStatus;
    renewsAt?: string;
  };
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  passwordHash?: string;
  role?: MemberRole;
  twoFactor?: {
    enabled: boolean;
    secret?: string;
    enabledAt?: string;
    setupExpiresAt?: string;
  };
}

export const COOKIE_NAME = "blog_member_session";
export const TWO_FACTOR_CHALLENGE_COOKIE_NAME = "blog_member_2fa_challenge";

export async function getCurrentUser(): Promise<MemberUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await getStoredSessionById(sessionId);
  if (!session) return null;

  const user = await getStoredUserById(session.userId);
  if (user?.accountStatus === "disabled") {
    await deleteStoredSession(sessionId);
    return null;
  }

  return user;
}

export async function createMemberSession(userId: string) {
  // 登录时删除该用户的旧 session，防止 session 固定攻击
  const cookieStore = await cookies();
  const oldSessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (oldSessionId) {
    await deleteStoredSession(oldSessionId);
  }
  
  const session = await createStoredSession(userId);
  cookieStore.set(COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function createTwoFactorChallenge(userId: string, nextPath = "") {
  const cookieStore = await cookies();
  const payload = Buffer.from(JSON.stringify({
    userId,
    nextPath,
    expiresAt: Date.now() + 1000 * 60 * 10,
    nonce: randomBytes(16).toString("hex"),
  })).toString("base64url");
  cookieStore.set(TWO_FACTOR_CHALLENGE_COOKIE_NAME, signTwoFactorChallengePayload(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
}

export async function getTwoFactorChallenge() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TWO_FACTOR_CHALLENGE_COOKIE_NAME)?.value;
  if (!raw) return null;

  const payload = verifyTwoFactorChallengeCookie(raw);
  if (!payload) {
    cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE_NAME);
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      userId?: string;
      nextPath?: string;
      expiresAt?: number;
    };
    if (!parsed.userId || !parsed.expiresAt || parsed.expiresAt <= Date.now()) {
      cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE_NAME);
      return null;
    }
    return { userId: parsed.userId, nextPath: parsed.nextPath ?? "" };
  } catch {
    cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE_NAME);
    return null;
  }
}

export async function clearTwoFactorChallenge() {
  const cookieStore = await cookies();
  cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE_NAME);
}

export async function completeTwoFactorChallenge(token: string) {
  const challenge = await getTwoFactorChallenge();
  if (!challenge) return { ok: false as const, error: "expired" as const };

  const user = await getStoredUserById(challenge.userId);
  if (!user || user.accountStatus === "disabled" || !user.twoFactor?.enabled || !user.twoFactor.secret) {
    await clearTwoFactorChallenge();
    return { ok: false as const, error: "invalid" as const };
  }

  if (!verifyTotpToken({ secret: user.twoFactor.secret, token })) {
    return { ok: false as const, error: "invalid" as const };
  }

  await clearTwoFactorChallenge();
  await createMemberSession(user.id);
  return { ok: true as const, user, nextPath: challenge.nextPath };
}

export async function clearMemberSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (sessionId) {
    await deleteStoredSession(sessionId);
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(nextPath = "/member"): Promise<MemberUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

export function hasActiveSubscription(user: MemberUser) {
  if (user.accountStatus === "disabled" || !user.emailVerified) return false;
  if (user.plan === "lifetime") return true;
  if (user.subscription.status !== "active") return false;
  if (!user.subscription.renewsAt) return false;
  return new Date(user.subscription.renewsAt).getTime() > Date.now();
}

export async function requireActiveSubscription(nextPath = "/member"): Promise<MemberUser> {
  const user = await requireAuth(nextPath);

  if (!hasActiveSubscription(user)) {
    redirect(!user.emailVerified ? "/account?email=verify_required#account-security" : "/subscribe");
  }

  return user;
}

export async function requireAdminAccess() {
  if (!isMemberAdminEnabled()) {
    notFound();
  }

  if (!(await isAdminRequestAllowed())) {
    notFound();
  }
}

async function isAdminRequestAllowed() {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get("host"));

  if (isLocalAdminHost(host)) {
    return true;
  }

  if (host !== ADMIN_HOST) return false;

  return Boolean(await getCloudflareAccessIdentity(headerStore));
}

function getTwoFactorChallengeSecret() {
  return requireProductionSecret(process.env.MEMBER_AUTH_SECRET || process.env.AUTH_SECRET, "MEMBER_AUTH_SECRET");
}

function signTwoFactorChallengePayload(payload: string) {
  const signature = createHmac("sha256", getTwoFactorChallengeSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyTwoFactorChallengeCookie(value: string) {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", getTwoFactorChallengeSecret()).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return payload;
}

export async function requireApiAuth(): Promise<MemberUser | Response> {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "请先登录。" }, { status: 401 });
  }

  return user;
}

export async function requireApiActiveSubscription(): Promise<MemberUser | Response> {
  const user = await requireApiAuth();
  if (user instanceof Response) return user;

  if (!hasActiveSubscription(user)) {
    return Response.json({ error: !user.emailVerified ? "请先验证邮箱。" : "当前订阅不可用。" }, { status: 403 });
  }

  return user;
}
