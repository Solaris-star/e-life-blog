import "server-only";

import { createHash } from "crypto";
import {
  appendStoredLoginEvent,
  getStoredLoginEvents,
  type StoredLoginEvent,
} from "./member-store";
import { getRegistrationRequestMeta, type RegistrationRequestMeta } from "./member-registration-security";

export type LoginRiskReason = "ip_login_rate_limited" | "email_login_rate_limited" | "fingerprint_login_rate_limited";

const tenMinutes = 10 * 60 * 1000;
const oneHour = 60 * 60 * 1000;

export async function getLoginRequestMeta(): Promise<RegistrationRequestMeta> {
  return getRegistrationRequestMeta();
}

export async function evaluateLoginRisk(input: {
  email: string;
  meta: RegistrationRequestMeta;
}): Promise<{ allowed: true } | { allowed: false; reason: LoginRiskReason }> {
  const now = Date.now();
  const events = (await getStoredLoginEvents()).filter(
    (event) => now - new Date(event.createdAt).getTime() <= oneHour,
  );
  const emailHash = hashValue(input.email.trim().toLowerCase());
  const failed = events.filter((event) => event.status !== "success");

  if (countRecent(failed, tenMinutes, now, (event) => event.emailHash === emailHash) >= 6) {
    return { allowed: false, reason: "email_login_rate_limited" };
  }

  if (countRecent(failed, tenMinutes, now, (event) => event.ip === input.meta.ip) >= 15) {
    return { allowed: false, reason: "ip_login_rate_limited" };
  }

  if (countRecent(failed, oneHour, now, (event) => event.fingerprint === input.meta.fingerprint) >= 30) {
    return { allowed: false, reason: "fingerprint_login_rate_limited" };
  }

  return { allowed: true };
}

export async function recordLoginAttempt(input: {
  email: string;
  meta: RegistrationRequestMeta;
  status: StoredLoginEvent["status"];
  reason?: string;
  userId?: string;
}) {
  await appendStoredLoginEvent({
    emailHash: hashValue(input.email.trim().toLowerCase()),
    ip: input.meta.ip,
    userAgent: input.meta.userAgent,
    fingerprint: input.meta.fingerprint,
    status: input.status,
    reason: input.reason,
    userId: input.userId,
  });
}

function countRecent(
  events: StoredLoginEvent[],
  windowMs: number,
  now: number,
  predicate: (event: StoredLoginEvent) => boolean,
) {
  return events.filter((event) => now - new Date(event.createdAt).getTime() <= windowMs && predicate(event)).length;
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
