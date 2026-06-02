const UMAMI_BASE_URL = process.env.UMAMI_BASE_URL ?? "http://127.0.0.1:3004";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  const headers = new Headers({
    "content-type": "application/json",
  });

  if (forwardedFor) {
    headers.set("x-forwarded-for", forwardedFor);
  }

  if (realIp) {
    headers.set("x-real-ip", realIp);
  }

  if (userAgent) {
    headers.set("user-agent", userAgent);
  }

  const response = await fetch(`${UMAMI_BASE_URL}/api/send`, {
    method: "POST",
    headers,
    body: await request.text(),
    cache: "no-store",
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
