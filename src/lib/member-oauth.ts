import "server-only";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export type OAuthProvider = "google" | "github";

export interface EnabledOAuthProvider {
  id: OAuthProvider;
  label: string;
}

interface OAuthProviderConfig {
  id: OAuthProvider;
  label: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
}

const stateCookieName = "blog_oauth_state";
const providerCookieName = "blog_oauth_provider";
const nextCookieName = "blog_oauth_next";

export function getEnabledOAuthProviders(): EnabledOAuthProvider[] {
  return getOAuthConfigs().map(({ id, label }) => ({ id, label }));
}

export function getOAuthProviderConfig(provider: string): OAuthProviderConfig | null {
  const config = getOAuthConfigs().find((item) => item.id === provider);
  return config ?? null;
}

export function getOAuthRedirectUri(provider: OAuthProvider) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.MEMBER_OAUTH_BASE_URL || "https://blog.sovoice.asia";
  return `${siteUrl.replace(/\/$/, "")}/api/member/oauth/${provider}/callback`;
}

export async function createOAuthState(provider: OAuthProvider, nextPath = "") {
  const cookieStore = await cookies();
  const state = randomBytes(24).toString("hex");
  const secure = getOAuthRedirectUri(provider).startsWith("https://");
  cookieStore.set(stateCookieName, state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 10 * 60,
  });
  cookieStore.set(providerCookieName, provider, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 10 * 60,
  });
  if (nextPath) {
    cookieStore.set(nextCookieName, nextPath, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 10 * 60,
    });
  } else {
    cookieStore.delete(nextCookieName);
  }
  return state;
}

export async function consumeOAuthState(provider: OAuthProvider, state: string | null) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(stateCookieName)?.value;
  const expectedProvider = cookieStore.get(providerCookieName)?.value;
  const nextPath = cookieStore.get(nextCookieName)?.value ?? "";
  cookieStore.delete(stateCookieName);
  cookieStore.delete(providerCookieName);
  cookieStore.delete(nextCookieName);
  return {
    valid: Boolean(state && expectedState && state === expectedState && expectedProvider === provider),
    nextPath: normalizeNextPath(nextPath),
  };
}

export function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";
  if (value.startsWith("/login") || value.startsWith("/register") || value.startsWith("/api/")) return "";
  return value;
}

function getOAuthConfigs(): OAuthProviderConfig[] {
  const configs: OAuthProviderConfig[] = [];

  if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    configs.push({
      id: "google",
      label: "Google",
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: "openid email profile",
    });
  }

  if (process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET) {
    configs.push({
      id: "github",
      label: "GitHub",
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      authUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scope: "read:user user:email",
    });
  }

  return configs;
}
