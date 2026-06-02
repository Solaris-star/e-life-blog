// ─────────────────────────────────────────────────────
// RadarSidebar — Right sidebar panels
// Order: GitHub Radar → X Hotspots → AI Deals
// ─────────────────────────────────────────────────────
import type { DailyRadarSections } from "../types";
import { GithubTrendingPanel } from "./GithubTrendingPanel";
import { XHotspotsPanel } from "./XHotspotsPanel";
import { AIDealsPanel } from "./AIDealsPanel";

export function RadarSidebar({ sections }: { sections: DailyRadarSections }) {
  return (
    <aside className="space-y-3">
      {/* 1. GitHub / Open Source Radar — most important sidebar module */}
      <GithubTrendingPanel items={sections.github_trending} />

      {/* 2. X AI Hotspots */}
      <XHotspotsPanel items={sections.x_ai_hotspots} />

      {/* 3. AI Deals / 羊毛福利 */}
      <AIDealsPanel items={sections.ai_deals} />
    </aside>
  );
}
