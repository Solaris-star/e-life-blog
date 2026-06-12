const UMAMI_BASE_URL = process.env.UMAMI_BASE_URL ?? "http://127.0.0.1:3004";
const MAX_BODY_BYTES = 64 * 1024;
const UPSTREAM_TIMEOUT_MS = 3_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

const hits = new Map<string, { count: number; resetAt: number }>();

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return jsonError("Unsupported media type", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("Payload too large", 413);
  }

  const clientKey = getClientKey(request);
  if (!consumeRateLimit(clientKey)) {
    return jsonError("Too many requests", 429);
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return jsonError("Payload too large", 413);
  }

  const headers = new Headers({
    "content-type": "application/json",
  });
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent.slice(0, 240));

  try {
    const response = await fetch(`${UMAMI_BASE_URL}/api/send`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return jsonError(timedOut ? "Analytics upstream timed out" : "Analytics unavailable", timedOut ? 504 : 502);
  }
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, {
    status,
    headers: { "x-content-type-options": "nosniff" },
  });
}

function getClientKey(request: Request) {
  if (process.env.TRUST_PROXY_HEADERS === "true") {
    return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? "unknown";
  }
  return "unknown";
}

function consumeRateLimit(key: string) {
  const now = Date.now();
  for (const [entryKey, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(entryKey);
  }

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}
