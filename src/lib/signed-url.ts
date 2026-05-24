import "server-only";

import crypto from "crypto";

const SIGNED_URL_TTL_SECONDS = 60 * 5;

function getSecret() {
  return process.env.MEMBER_DOWNLOAD_SECRET || "local-member-download-secret";
}

export function createSignedResourceToken(resourceId: string, userId: string) {
  const expires = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
  const payload = `${resourceId}.${userId}.${expires}`;
  const signature = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");

  return { token: `${payload}.${signature}`, expires };
}

export function verifySignedResourceToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [resourceId, userId, expiresRaw, signature] = parts;
  const expires = Number(expiresRaw);
  if (!resourceId || !userId || !expires || expires < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const payload = `${resourceId}.${userId}.${expires}`;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  if (signature.length !== expected.length) return null;

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  return { resourceId, userId, expires };
}
