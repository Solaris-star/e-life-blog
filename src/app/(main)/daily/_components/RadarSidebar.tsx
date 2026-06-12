// ─────────────────────────────────────────────────────
// RadarSidebar — Right sidebar panels
// Order: GitHub Radar → X Hotspots
// Reveal 包在 aside 内层：保持 .daily-side-col > aside 选择器有效
// ─────────────────────────────────────────────────────
import type { DailyRadarSections } from "../types";
import { Reveal } from "@/components/layout/Reveal";
import { GithubTrendingPanel } from "./GithubTrendingPanel";
import { XHotspotsPanel } from "./XHotspotsPanel";

export function RadarSidebar({ sections }: { sections: DailyRadarSections }) {
  return (
    <aside className="space-y-3">
      {/* 1. GitHub / Open Source Radar */}
      <Reveal index={3}>
        <GithubTrendingPanel items={sections.github_trending} />
      </Reveal>

      {/* 2. X AI Hotspots */}
      <Reveal index={4}>
        <XHotspotsPanel items={sections.x_ai_hotspots} />
      </Reveal>
    </aside>
  );
}
