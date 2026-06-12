import { NextRequest, NextResponse } from "next/server";
import { createOAuthState, getOAuthProviderConfig, getOAuthRedirectUri, normalizeNextPath, type OAuthProvider } from "@/lib/member-oauth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const config = getOAuthProviderConfig(provider);
  if (!config) {
    return NextResponse.redirect(new URL("/login?error=oauth_unavailable", request.url));
  }

  const nextPath = normalizeNextPath(request.nextUrl.searchParams.get("next") ?? "");
  const state = await createOAuthState(config.id as OAuthProvider, nextPath);
  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", getOAuthRedirectUri(config.id as OAuthProvider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  if (config.id === "google") {
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "select_account");
  }
  return NextResponse.redirect(url);
}
