import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareAccessIdentity, isLocalAdminHost, normalizeHost } from "./lib/cloudflare-access";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    const host = normalizeHost(request.headers.get("host"));
    if (isLocalAdminHost(host)) {
      // Local development only.
    } else if (!(await getCloudflareAccessIdentity(request.headers))) {
      return new NextResponse(null, { status: 404 });
    }
  }

  const response = NextResponse.next();

  if (
    pathname.startsWith("/member") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/member")
  ) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("CDN-Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: ["/member/:path*", "/account", "/admin/:path*", "/api/member/:path*"],
};
