// ─────────────────────────────────────────────────────
// Daily Page — DailyBrief news feed
// ─────────────────────────────────────────────────────
import { DailyHero } from "./_components/DailyHero";
import { TopStoriesList } from "./_components/TopStoriesList";
import { RadarSidebar } from "./_components/RadarSidebar";
import { TabbedSections } from "./_components/TabbedSections";
import { Reveal } from "@/components/layout/Reveal";
import { getRadarData } from "@/lib/daily/getRadarData";

export const dynamic = "force-dynamic";

function formatSyncDate(value: string): string {
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function DailyPage() {
  const radar = await getRadarData();

  if (!radar) {
    return (
      <div className="space-y-10 pb-8">
        <header className="mcm-panel p-8 text-center">
          <p className="section-kicker">AI Roadmap</p>
          <h1 className="mt-3 text-[2.2rem] font-black text-[var(--foreground)]">
            年度 AI 关键节点路线图
          </h1>
          <p className="mt-3 text-[14px] text-[var(--walnut)]">
            DailyBrief 后端暂时不可用，请稍后回来查看。
          </p>
        </header>
      </div>
    );
  }

  const { sections } = radar;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 pb-10 pt-4 md:px-6">
      {/* ═════ Hero ═══════════════════════════ */}
      {/* z-20:入场动画的 transform 会建立层叠上下文，抬高 hero
          保证桌面端节点浮层始终盖在下方面板之上 */}
      <Reveal className="relative z-20">
        <DailyHero radar={radar} />
      </Reveal>

      {/* ═════ 2-col grid (main + sidebar) ═════ */}
      <div className="daily-grid">
        {/* Left: Top Stories + compact sections */}
        <div className="daily-main-col">
          <Reveal index={1}>
            <TopStoriesList stories={sections.top_stories} />
          </Reveal>

          {/* AI Tools / Research / Business / Risks — tabbed */}
          <Reveal index={2}>
            <TabbedSections sections={sections} />
          </Reveal>
        </div>

        {/* Right: Radar Sidebar */}
        <div className="daily-side-col">
          <RadarSidebar sections={sections} />
        </div>
      </div>

      {/* ═════ Footer ═════════════════════════ */}
      <footer className="text-center text-[13px] text-[var(--walnut)]/80">
        内容均来自原媒体，本站仅作摘要整理与回链。
        {(radar.updated_at || radar.generated_at) && (
          <>
            {" "}更新于{" "}
            {formatSyncDate(radar.updated_at || radar.generated_at)}
          </>
        )}
      </footer>
    </div>
  );
}
