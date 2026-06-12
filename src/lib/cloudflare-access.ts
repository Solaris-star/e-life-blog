import "server-only";

import { createHash } from "crypto";

interface CloudflareAccessClaims {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  nbf?: number;
  sub?: string;
}

interface JsonWebKeySet {
  keys?: JsonWebKey[];
}

interface JsonWebKey {
  kid?: string;
  kty?: string;
  alg?: string;
  use?: string;
  n?: string;
  e?: string;
}

const jwksCache = new Map<string, { expiresAt: number; keys: JsonWebKey[] }>();
const jwksCacheTtlMs = 10 * 60 * 1000;

export const ADMIN_HOST = "admin.solarisovo.icu";

export interface VerifiedCloudflareAccessIdentity {
  email: string;
  claims: CloudflareAccessClaims;
}

export async function verifyCloudflareAccessJwt(token: string | null | undefined): Promise<VerifiedCloudflareAccessIdentity | null> {
  if (!token) return null;

  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN?.trim();
  const audience = process.env.CF_ACCESS_AUD?.trim();
  if (!teamDomain || !audience) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const header = parseJwtJson<{ alg?: string; kid?: string }>(parts[0]);
  const claims = parseJwtJson<CloudflareAccessClaims>(parts[1]);
  if (!header || !claims || header.alg !== "RS256" || !header.kid) return null;

  const issuer = normalizeTeamDomain(teamDomain);
  if (claims.iss !== issuer) return null;
  if (!hasAudience(claims.aud, audience)) return null;
  if (!isTimeValid(claims)) return null;
  if (!claims.email || !isAllowedEmail(claims.email)) return null;

  const key = (await getCloudflareAccessKeys(issuer)).find((item) => item.kid === header.kid);
  if (!key) return null;

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    base64UrlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!verified) return null;

  return { email: claims.email, claims };
}

export async function getCloudflareAccessIdentity(headers: Headers): Promise<VerifiedCloudflareAccessIdentity | null> {
  const verifiedJwt = await verifyCloudflareAccessJwt(headers.get("cf-access-jwt-assertion"));
  if (verifiedJwt) return verifiedJwt;

  // 生产环境必须验证 JWT，不接受裸邮箱头
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  // 开发环境才允许裸邮箱头（用于本地测试）
  const authenticatedEmail = headers.get("cf-access-authenticated-user-email")?.trim();
  if (!authenticatedEmail) return null;

  return {
    email: authenticatedEmail,
    claims: { email: authenticatedEmail },
  };
}

export function isLocalAdminHost(host: string) {
  // 生产环境不允许本地访问
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  
  // 开发环境只允许本机回环地址
  return host === "localhost" || host === "127.0.0.1";
}

export function normalizeHost(host: string | null) {
  return (host ?? "").split(":")[0].toLowerCase();
}

function parseJwtJson<T>(encoded: string) {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}

function normalizeTeamDomain(value: string) {
  const trimmed = value.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${trimmed}`;
}

function hasAudience(claimAudience: string | string[] | undefined, expected: string) {
  if (Array.isArray(claimAudience)) return claimAudience.includes(expected);
  return claimAudience === expected;
}

function isTimeValid(claims: CloudflareAccessClaims) {
  const now = Math.floor(Date.now() / 1000);
  if (!claims.exp || claims.exp <= now) return false;
  if (claims.nbf && claims.nbf > now + 60) return false;
  if (claims.iat && claims.iat > now + 60) return false;
  return true;
}

function isAllowedEmail(email: string) {
  const allowed = process.env.CF_ACCESS_ALLOWED_EMAILS?.split(",").map((item: string) => item.trim().toLowerCase()).filter(Boolean);
  if (!allowed?.length) return process.env.NODE_ENV !== "production";
  return allowed.includes(email.toLowerCase());
}

async function getCloudflareAccessKeys(issuer: string) {
  const cached = jwksCache.get(issuer);
  if (cached && cached.expiresAt > Date.now()) return cached.keys;

  const response = await fetch(`${issuer}/cdn-cgi/access/certs`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) return [];

  const data = (await response.json()) as JsonWebKeySet;
  const keys = data.keys?.filter((key) => key.kty === "RSA" && key.kid && key.n && key.e) ?? [];
  jwksCache.set(issuer, { keys, expiresAt: Date.now() + jwksCacheTtlMs });
  return keys;
}

function base64UrlToBytes(value: string) {
  return Uint8Array.from(Buffer.from(value, "base64url"));
}

export function cloudflareAccessConfigFingerprint() {
  return createHash("sha256").update(`${process.env.CF_ACCESS_TEAM_DOMAIN ?? ""}|${process.env.CF_ACCESS_AUD ?? ""}`).digest("hex");
}
