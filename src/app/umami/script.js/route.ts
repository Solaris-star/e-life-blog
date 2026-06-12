const UMAMI_BASE_URL = process.env.UMAMI_BASE_URL ?? "http://127.0.0.1:3004";
const UPSTREAM_TIMEOUT_MS = 3_000;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(`${UMAMI_BASE_URL}/script.js`, {
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!response.ok) {
      return new Response("Umami script unavailable", { status: 502 });
    }

    return new Response(await response.text(), {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return new Response(timedOut ? "Umami script timed out" : "Umami script unavailable", {
      status: timedOut ? 504 : 502,
      headers: { "x-content-type-options": "nosniff" },
    });
  }
}
