const UMAMI_BASE_URL = process.env.UMAMI_BASE_URL ?? "http://127.0.0.1:3004";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = await fetch(`${UMAMI_BASE_URL}/script.js`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return new Response("Umami script unavailable", { status: 502 });
  }

  return new Response(await response.text(), {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
