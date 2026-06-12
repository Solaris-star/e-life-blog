import { NextRequest, NextResponse } from "next/server";
import { consumeOAuthState, getOAuthProviderConfig, getOAuthRedirectUri, type OAuthProvider } from "@/lib/member-oauth";
import { loginOrRegisterOAuthMember } from "@/lib/member-service";

interface GoogleUserInfo {
  email?: string;
  email_verified?: boolean;
  name?: string;
}

interface GitHubUserInfo {
  name?: string | null;
  login?: string;
}

interface GitHubEmailInfo {
  email: string;
  primary: boolean;
  verified: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const config = getOAuthProviderConfig(provider);
  if (!config) {
    return NextResponse.redirect(new URL("/login?error=oauth_unavailable", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const providerId = config.id as OAuthProvider;
  const oauthState = await consumeOAuthState(providerId, state);

  if (!code || !oauthState.valid) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", request.url));
  }

  const token = await exchangeCodeForToken(providerId, code);
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const profile = providerId === "google" ? await getGoogleProfile(token) : await getGitHubProfile(token);
  if (!profile?.email) {
    return NextResponse.redirect(new URL("/login?error=oauth_email", request.url));
  }

  const result = await loginOrRegisterOAuthMember({
    email: profile.email,
    name: profile.name || profile.email.split("@")[0],
    provider: providerId,
  });

  if (!result.ok) {
    if (result.error === "two_factor_required") {
      return NextResponse.redirect(new URL(`/login/2fa${oauthState.nextPath ? `?next=${encodeURIComponent(oauthState.nextPath)}` : ""}`, request.url));
    }
    return NextResponse.redirect(new URL(`/login?error=${result.error}`, request.url));
  }

  return NextResponse.redirect(new URL(oauthState.nextPath || (result.user.subscription.status === "active" || result.user.plan === "lifetime" ? "/member" : "/account"), request.url));
}

async function exchangeCodeForToken(provider: OAuthProvider, code: string) {
  const config = getOAuthProviderConfig(provider);
  if (!config) return null;

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: getOAuthRedirectUri(provider),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function getGoogleProfile(token: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as GoogleUserInfo;
  if (!data.email || !data.email_verified) return null;
  return { email: data.email, name: data.name };
}

async function getGitHubProfile(token: string) {
  const [userResponse, emailsResponse] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      cache: "no-store",
    }),
    fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      cache: "no-store",
    }),
  ]);
  if (!userResponse.ok || !emailsResponse.ok) return null;
  const user = (await userResponse.json()) as GitHubUserInfo;
  const emails = (await emailsResponse.json()) as GitHubEmailInfo[];
  const primary = emails.find((email) => email.primary && email.verified) ?? emails.find((email) => email.verified);
  if (!primary) return null;
  return { email: primary.email, name: user.name || user.login || primary.email.split("@")[0] };
}
