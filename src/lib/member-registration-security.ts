import "server-only";

import { createHash, randomBytes } from "crypto";
import { isIP } from "net";
import { headers } from "next/headers";
import type { StoredMemberUser } from "./member-store";
import {
  appendStoredRegistrationEvent,
  getStoredRegistrationEvents,
  type StoredRegistrationEvent,
} from "./member-store";

export type RegistrationRiskReason =
  | "email_domain_not_allowed"
  | "ip_rate_limited"
  | "email_rate_limited"
  | "fingerprint_rate_limited"
  | "honeypot";

export interface RegistrationRequestMeta {
  ip: string;
  userAgent: string;
  fingerprint: string;
}

const allowedEmailDomains = new Set([
  "163.com",
  "qq.com",
  "hotmail.com",
  "outlook.com",
]);

const tenMinutes = 10 * 60 * 1000;
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * 60 * 60 * 1000;

export function isAllowedMemberEmailDomain(email: string) {
  const domain = getEmailDomain(email);
  return Boolean(domain && allowedEmailDomains.has(domain));
}

export function getAllowedMemberEmailDomains() {
  return [...allowedEmailDomains];
}

export async function getRegistrationRequestMeta(): Promise<RegistrationRequestMeta> {
  const headerStore = await headers();
  const rawIp = getTrustedClientIp(headerStore);
  const userAgent = (headerStore.get("user-agent") ?? "unknown").slice(0, 240);
  const fingerprint = hashValue(`${rawIp}|${userAgent}`);

  return {
    ip: rawIp,
    userAgent,
    fingerprint,
  };
}

export async function evaluateRegistrationRisk(input: {
  email: string;
  meta: RegistrationRequestMeta;
  honeypot?: string;
}): Promise<{ allowed: true } | { allowed: false; reason: RegistrationRiskReason }> {
  if (input.honeypot?.trim()) {
    return { allowed: false, reason: "honeypot" };
  }

  if (!isAllowedMemberEmailDomain(input.email)) {
    return { allowed: false, reason: "email_domain_not_allowed" };
  }

  const now = Date.now();
  const events = (await getStoredRegistrationEvents()).filter(
    (event) => now - new Date(event.createdAt).getTime() <= oneDay,
  );
  const emailHash = hashValue(input.email.trim().toLowerCase());

  if (countRecent(events, oneHour, now, (event) => event.emailHash === emailHash) >= 3) {
    return { allowed: false, reason: "email_rate_limited" };
  }

  if (countRecent(events, tenMinutes, now, (event) => event.ip === input.meta.ip) >= 5) {
    return { allowed: false, reason: "ip_rate_limited" };
  }

  if (countRecent(events, oneHour, now, (event) => event.ip === input.meta.ip) >= 20) {
    return { allowed: false, reason: "ip_rate_limited" };
  }

  if (countRecent(events, oneHour, now, (event) => event.fingerprint === input.meta.fingerprint) >= 12) {
    return { allowed: false, reason: "fingerprint_rate_limited" };
  }

  return { allowed: true };
}

export async function recordRegistrationAttempt(input: {
  email: string;
  meta: RegistrationRequestMeta;
  status: StoredRegistrationEvent["status"];
  reason?: string;
  user?: StoredMemberUser;
}) {
  await appendStoredRegistrationEvent({
    emailHash: hashValue(input.email.trim().toLowerCase()),
    domain: getEmailDomain(input.email) ?? "invalid",
    ip: input.meta.ip,
    userAgent: input.meta.userAgent,
    fingerprint: input.meta.fingerprint,
    status: input.status,
    reason: input.reason,
    userId: input.user?.id,
  });
}

function getEmailDomain(email: string) {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return parts[1];
}

function getTrustedClientIp(headerStore: Headers) {
  if (process.env.TRUST_PROXY_HEADERS !== "true") {
    return "unknown";
  }

  const candidates = [
    headerStore.get("cf-connecting-ip"),
    headerStore.get("x-real-ip"),
    lastForwardedIp(headerStore.get("x-forwarded-for")),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIp(candidate);
    if (normalized) return normalized;
  }

  return "unknown";
}

function lastForwardedIp(value: string | null) {
  const parts = value?.split(",").map((item) => item.trim()).filter(Boolean);
  return parts?.at(-1) ?? null;
}

function normalizeIp(value: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > 80 || trimmed.includes(",")) return null;
  return isIP(trimmed) ? trimmed : null;
}

function countRecent(
  events: StoredRegistrationEvent[],
  windowMs: number,
  now: number,
  predicate: (event: StoredRegistrationEvent) => boolean,
) {
  return events.filter((event) => now - new Date(event.createdAt).getTime() <= windowMs && predicate(event)).length;
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createRegistrationNonce() {
  return randomBytes(16).toString("hex");
}
