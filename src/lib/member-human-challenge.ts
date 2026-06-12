import "server-only";

import { createHash, randomInt } from "crypto";
import {
  consumeStoredHumanChallenge,
  createStoredHumanChallenge,
  getStoredLoginEvents,
  getStoredRegistrationEvents,
} from "./member-store";
import { getRegistrationRequestMeta, type RegistrationRequestMeta } from "./member-registration-security";

export type HumanChallengePurpose = "register" | "login";

export type HumanChallenge =
  | { provider: "turnstile"; siteKey: string }
  | { provider: "local"; id: string; question: string };

const oneMinute = 60 * 1000;
const fiveMinutes = 5 * oneMinute;
const turnstileVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function createHumanChallenge(purpose: HumanChallengePurpose): Promise<HumanChallenge> {
  const turnstile = getTurnstileConfig();
  if (turnstile) return { provider: "turnstile", siteKey: turnstile.siteKey };

  const meta = await getRegistrationRequestMeta();
  const left = randomInt(2, 10);
  const right = randomInt(2, 10);
  const answer = String(left + right);
  const challenge = await createStoredHumanChallenge({
    answerHash: hashAnswer(answer),
    ip: meta.ip,
    fingerprint: meta.fingerprint,
    purpose,
  });
  return { provider: "local", id: challenge.id, question: `${left} + ${right} = ?` };
}

export async function verifyHumanChallenge(input: {
  purpose: HumanChallengePurpose;
  challengeId?: string;
  answer?: string;
  turnstileToken?: string;
  meta?: RegistrationRequestMeta;
}) {
  const meta = input.meta ?? await getRegistrationRequestMeta();
  const turnstile = getTurnstileConfig();
  if (turnstile) {
    return verifyTurnstileToken({ secretKey: turnstile.secretKey, token: input.turnstileToken ?? "", ip: meta.ip });
  }

  if (!input.challengeId) return false;

  const challenge = await consumeStoredHumanChallenge(input.challengeId);
  if (!challenge || challenge.usedAt || challenge.purpose !== input.purpose) return false;
  if (new Date(challenge.expiresAt).getTime() <= Date.now()) return false;
  if (challenge.ip !== meta.ip || challenge.fingerprint !== meta.fingerprint) return false;
  return challenge.answerHash === hashAnswer((input.answer ?? "").trim());
}

export async function shouldChallengeLogin(meta: RegistrationRequestMeta) {
  const now = Date.now();
  const events = await getStoredLoginEvents();
  const recent = events.filter((event) => now - new Date(event.createdAt).getTime() <= fiveMinutes);
  const ipHits = recent.filter((event) => event.ip === meta.ip).length;
  const fingerprintHits = recent.filter((event) => event.fingerprint === meta.fingerprint).length;
  const failedIpHits = recent.filter((event) => event.ip === meta.ip && event.status !== "success").length;
  return ipHits >= 12 || fingerprintHits >= 12 || failedIpHits >= 4;
}

export async function shouldChallengeRegistration(meta: RegistrationRequestMeta) {
  const now = Date.now();
  const events = await getStoredRegistrationEvents();
  const recent = events.filter((event) => now - new Date(event.createdAt).getTime() <= fiveMinutes);
  const ipHits = recent.filter((event) => event.ip === meta.ip).length;
  const fingerprintHits = recent.filter((event) => event.fingerprint === meta.fingerprint).length;
  return ipHits >= 2 || fingerprintHits >= 2;
}

function getTurnstileConfig() {
  const siteKey = process.env.TURNSTILE_SITE_KEY?.trim();
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!siteKey || !secretKey) return null;
  return { siteKey, secretKey };
}

async function verifyTurnstileToken(input: { secretKey: string; token: string; ip: string }) {
  if (!input.token) return false;

  const body = new URLSearchParams({
    secret: input.secretKey,
    response: input.token,
  });
  if (input.ip && input.ip !== "unknown") body.set("remoteip", input.ip);

  try {
    const response = await fetch(turnstileVerifyUrl, {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

function hashAnswer(answer: string) {
  return createHash("sha256").update(answer).digest("hex");
}
