import { normalizeDailyBrief } from "@/lib/daily/normalizeDailyBrief";
import type { DailyRadarDTO } from "@/app/(main)/daily/types";

const DAILYBRIEF_INTERNAL =
  process.env.DAILYBRIEF_API_URL ?? "http://dailybrief:8080";

export async function getRadarData(): Promise<DailyRadarDTO | null> {
  try {
    const radarRes = await fetch(`${DAILYBRIEF_INTERNAL}/api/radar`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });

    if (radarRes.ok) {
      const raw = await radarRes.json();
      return normalizeDailyBrief(raw);
    }

    const legacyRes = await fetch(`${DAILYBRIEF_INTERNAL}/api/daily-brief`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!legacyRes.ok) return null;

    const raw = await legacyRes.json();
    return normalizeDailyBrief(raw);
  } catch {
    return null;
  }
}
