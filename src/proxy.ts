import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/member") || pathname.startsWith("/account") || pathname.startsWith("/api/member")) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("CDN-Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: ["/member/:path*", "/account", "/api/member/:path*"],
};
