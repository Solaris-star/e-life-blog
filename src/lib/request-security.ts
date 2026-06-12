import "server-only";

import { headers } from "next/headers";
import { ADMIN_HOST, normalizeHost } from "./cloudflare-access";

const minimumSecretLength = 32;

export function requireProductionSecret(value: string | undefined, name: string) {
  const secret = value?.trim();
  if (secret && secret.length >= minimumSecretLength) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be at least ${minimumSecretLength} characters in production.`);
  }

  return "local-development-secret-do-not-use-in-production";
}

export async function assertSameOriginAction(allowedHosts = [ADMIN_HOST]) {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get("host"));
  const origin = headerStore.get("origin");
  const referer = headerStore.get("referer");
  const secFetchSite = headerStore.get("sec-fetch-site")?.toLowerCase();

  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    throw new Error("Cross-site action rejected.");
  }

  const allowed = new Set(allowedHosts.map((item) => normalizeHost(item)));
  if (!allowed.has(host)) {
    throw new Error("Action host rejected.");
  }

  const source = origin ?? referer;
  if (!source) return;

  let sourceHost = "";
  try {
    sourceHost = normalizeHost(new URL(source).host);
  } catch {
    throw new Error("Action origin rejected.");
  }

  if (!allowed.has(sourceHost) || sourceHost !== host) {
    throw new Error("Action origin rejected.");
  }
}
