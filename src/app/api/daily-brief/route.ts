/**
 * GET /api/daily-brief[?date=YYYY-MM-DD]
 *
 * Proxies DailyBrief internal API → returns sanitized DailyRadarDTO.
 * Prefer the radar pipeline output, with legacy daily brief as fallback.
 * NEVER exposes raw articles, search queries, prompt, or debug data.
 */
import { type NextRequest } from "next/server";
import { normalizeDailyBrief } from "@/lib/daily/normalizeDailyBrief";

// ── Config ──────────────────────────────────────────
const DAILYBRIEF_URL =
  process.env.DAILYBRIEF_API_URL ?? "http://dailybrief:8080";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PUB_CACHE =
  "public, max-age=300, stale-while-revalidate=3600";

export const dynamic = "force-dynamic";

// ── GET ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawDate = url.searchParams.get("date");

    // Validate date
    if (rawDate && !DATE_RE.test(rawDate)) {
      return Response.json(
        { error: `Invalid date format. Expected YYYY-MM-DD.` },
        { status: 400 },
      );
    }

    const encodedDate = rawDate ? encodeURIComponent(rawDate) : null;
    const targetUrls = encodedDate
      ? [
          `${DAILYBRIEF_URL}/api/radar?date=${encodedDate}`,
          `${DAILYBRIEF_URL}/api/daily-brief?date=${encodedDate}`,
        ]
      : [
          `${DAILYBRIEF_URL}/api/radar`,
          `${DAILYBRIEF_URL}/api/daily-brief`,
        ];

    for (const targetUrl of targetUrls) {
      const upstream = await fetch(targetUrl, {
        signal: AbortSignal.timeout(10_000),
      });

      if (upstream.status === 404) continue;

      if (!upstream.ok) {
        return Response.json(
          { error: "Failed to fetch daily brief" },
          { status: 502 },
        );
      }

      const raw = await upstream.json();
      const radar = normalizeDailyBrief(raw);

      if (!radar) {
        return Response.json(
          { error: "Invalid data from upstream" },
          { status: 502 },
        );
      }

      return Response.json(radar, {
        headers: { "Cache-Control": PUB_CACHE },
      });
    }

    return Response.json(
      { error: rawDate ? `No report for ${rawDate}` : "No reports available" },
      { status: 404 },
    );
  } catch (err) {
    // NEVER leak internals
    console.error(
      "[api/daily-brief] error:",
      (err as Error).message,
    );
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 503 },
    );
  }
}
