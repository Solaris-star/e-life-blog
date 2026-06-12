"use client";

// ─────────────────────────────────────────────────────
// RoadmapTimeline — 年度节点时间轴（客户端交互层）。
// 状态 / 进度由服务端 DailyHero 预计算后以 props 下发，本组件不重算。
// ≥1401px：节点为外链，hover / focus 显示 CSS 浮层（原行为不变）；
// ≤1400px：浮层被 CSS 隐藏，节点退化为切换按钮，点击在轨道下方
// 展开内联详情条（单开，再点同一节点收起），触控目标 ≥44px。
// ─────────────────────────────────────────────────────
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, Radio } from "lucide-react";

export type EventStatus = "ended" | "live" | "upcoming";

export type RoadmapEventView = {
  name: string;
  label: string;
  location: string;
  category: string;
  signal: string;
  href: string;
  status: EventStatus;
};

export const STATUS_META: Record<
  EventStatus,
  { label: string; icon: typeof CheckCircle2 }
> = {
  ended: { label: "已结束", icon: CheckCircle2 },
  live: { label: "进行中", icon: Radio },
  upcoming: { label: "未开始", icon: Clock3 },
};

export function StatusPill({ status }: { status: EventStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <span className="ai-roadmap-status" data-status={status}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function RoadmapTimeline({
  events,
  progress,
  year,
}: {
  events: RoadmapEventView[];
  progress: number;
  year: number;
}) {
  // ≤1400px 时 hover 浮层被 CSS 隐藏，改为「点节点 → 轨道下方内联详情条」
  const [compact, setCompact] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1400px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const selected = compact
    ? (events.find((event) => event.name === selectedName) ?? null)
    : null;

  const progressStyle = {
    "--roadmap-progress": `${progress}%`,
  } as CSSProperties;

  return (
    <div className="ai-roadmap-timeline">
      <nav
        className="ai-roadmap-track compact"
        style={progressStyle}
        aria-label={`${year} AI 关键节点`}
      >
        <div className="ai-roadmap-rail" aria-hidden="true" />
        <ol className="ai-roadmap-list">
          {events.map((event) => {
            const isSelected = selected?.name === event.name;
            const inner = (
              <>
                <span className="ai-roadmap-dot" aria-hidden="true" />
                <span className="ai-roadmap-label">
                  <span className="ai-roadmap-date">{event.label}</span>
                  <span className="ai-roadmap-name">{event.name}</span>
                </span>
              </>
            );

            return (
              <li className="ai-roadmap-node" data-status={event.status} key={event.name}>
                {compact ? (
                  <button
                    type="button"
                    className={`ai-roadmap-link ai-roadmap-toggle${isSelected ? " is-selected" : ""}`}
                    aria-expanded={isSelected}
                    aria-controls={isSelected ? "ai-roadmap-detail" : undefined}
                    aria-label={`${event.name}，${STATUS_META[event.status].label}，查看详情`}
                    onClick={() =>
                      setSelectedName(isSelected ? null : event.name)
                    }
                  >
                    {inner}
                  </button>
                ) : (
                  <a
                    className="ai-roadmap-link"
                    href={event.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${event.name}，${STATUS_META[event.status].label}，打开官方页面`}
                  >
                    {inner}
                    <RoadmapPopover event={event} />
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {selected && (
        <div
          id="ai-roadmap-detail"
          className="ai-roadmap-detail"
          data-status={selected.status}
          role="region"
          aria-label={`${selected.name} 详情`}
        >
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[14px] font-black leading-tight text-[var(--foreground)]">
                {selected.name}
              </span>
              <span className="mt-1 block font-mono text-[11px] font-bold text-[var(--walnut)]">
                {selected.label} · {selected.location}
              </span>
            </span>
            <StatusPill status={selected.status} />
          </span>
          <span className="mt-2 block text-[12px] font-bold text-[var(--accent-strong)]">
            {selected.category}
          </span>
          <span className="mt-1.5 block text-[12px] leading-relaxed text-[var(--foreground)]/78">
            {selected.signal}
          </span>
          <a
            className="ai-roadmap-detail-link"
            href={selected.href}
            target="_blank"
            rel="noreferrer"
          >
            打开官方页面
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}

function RoadmapPopover({ event }: { event: RoadmapEventView }) {
  return (
    <span className="ai-roadmap-popover" role="tooltip">
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-[13px] font-black leading-tight text-[var(--foreground)]">
            {event.name}
          </span>
          <span className="mt-1 block font-mono text-[11px] font-bold text-[var(--walnut)]">
            {event.label} · {event.location}
          </span>
        </span>
        <StatusPill status={event.status} />
      </span>
      <span className="mt-2 block text-[12px] font-bold text-[var(--accent-strong)]">
        {event.category}
      </span>
      <span className="mt-1.5 block text-[12px] leading-relaxed text-[var(--foreground)]/78">
        {event.signal}
      </span>
      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[var(--accent-strong)]">
        官方页面
        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      </span>
    </span>
  );
}
