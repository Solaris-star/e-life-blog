// ─────────────────────────────────────────────────────
// DailyHero — 紧凑年度 AI 节点路线图
// ─────────────────────────────────────────────────────
import type { CSSProperties } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Radio,
  Route,
} from "lucide-react";
import type { DailyRadarDTO } from "../types";

type EventStatus = "ended" | "live" | "upcoming";

type RoadmapEvent = {
  name: string;
  start: [month: number, day: number];
  end: [month: number, day: number];
  label: string;
  location: string;
  category: string;
  signal: string;
  href: string;
};

type RoadmapEventWithStatus = RoadmapEvent & {
  status: EventStatus;
};

const AI_ROADMAP_EVENTS: RoadmapEvent[] = [
  {
    name: "NVIDIA GTC",
    start: [3, 16],
    end: [3, 19],
    label: "3.16-19",
    location: "San Jose",
    category: "算力 / GPU / Physical AI",
    signal: "年度 AI 基础设施和加速计算风向标，重点看 GPU、推理、机器人与物理 AI。",
    href: "https://www.nvidia.com/gtc/",
  },
  {
    name: "Google Cloud Next",
    start: [4, 22],
    end: [4, 24],
    label: "4.22-24",
    location: "Las Vegas",
    category: "云 / 企业 AI",
    signal: "Google Cloud、Gemini、Vertex AI 和企业 Agent 落地节奏集中释放。",
    href: "https://www.googlecloudevents.com/next-vegas",
  },
  {
    name: "Google I/O",
    start: [5, 19],
    end: [5, 20],
    label: "5.19-20",
    location: "Mountain View",
    category: "模型 / Android / 开发者生态",
    signal: "Google 年度开发者发布节点，重点看 Gemini、搜索、Android 和多模态产品。",
    href: "https://io.google/2026/about",
  },
  {
    name: "Microsoft Build",
    start: [6, 2],
    end: [6, 3],
    label: "6.2-3",
    location: "San Francisco",
    category: "Copilot / Azure AI / 开发工具",
    signal: "2026 年 6 月 2-3 日举行。重点看 Copilot、Azure AI、Agent 和 Windows AI。",
    href: "https://build.microsoft.com/en-US/home",
  },
  {
    name: "CVPR",
    start: [6, 3],
    end: [6, 7],
    label: "6.3-7",
    location: "Denver",
    category: "视觉 / 多模态研究",
    signal: "计算机视觉顶会，视频理解、生成式视觉、3D 和多模态评测值得跟踪。",
    href: "https://cvpr.thecvf.com/Conferences/2026/Dates",
  },
  {
    name: "WWDC",
    start: [6, 8],
    end: [6, 12],
    label: "6.8-12",
    location: "Cupertino / Online",
    category: "端侧 AI / Apple 平台",
    signal: "Apple 平台年度节点，重点看系统级 AI、Siri、开发框架和端侧能力。",
    href: "https://developer.apple.com/wwdc26/",
  },
  {
    name: "ICML",
    start: [7, 6],
    end: [7, 11],
    label: "7.6-11",
    location: "Seoul",
    category: "机器学习研究",
    signal: "机器学习顶会，新训练方法、模型架构、理论与评测会进入产业观察区。",
    href: "https://icml.cc/Conferences/2026/Dates",
  },
  {
    name: "AWS re:Invent",
    start: [11, 30],
    end: [12, 4],
    label: "11.30-12.4",
    location: "Las Vegas",
    category: "云基础设施 / 企业 AI",
    signal: "AWS 年度云大会，重点看 Bedrock、算力、数据库和企业 AI 工程化。",
    href: "https://aws.amazon.com/events/reinvent/",
  },
  {
    name: "NeurIPS",
    start: [12, 6],
    end: [12, 12],
    label: "12.6-12",
    location: "Sydney",
    category: "年度 AI 研究收束",
    signal: "年底最重要的 AI 研究节点之一，适合观察下一年模型和评测方向。",
    href: "https://neurips.cc/Conferences/2026/Dates",
  },
];

const STATUS_META: Record<
  EventStatus,
  { label: string; icon: typeof CheckCircle2 }
> = {
  ended: { label: "已结束", icon: CheckCircle2 },
  live: { label: "进行中", icon: Radio },
  upcoming: { label: "未开始", icon: Clock3 },
};

function getReferenceDate(date: string): Date {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function dateInYear(year: number, [month, day]: [number, number], endOfDay = false) {
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, 0);
}

function getStatus(event: RoadmapEvent, year: number, referenceDate: Date): EventStatus {
  const startDate = dateInYear(year, event.start);
  const endDate = dateInYear(year, event.end, true);

  if (referenceDate > endDate) return "ended";
  if (referenceDate >= startDate) return "live";
  return "upcoming";
}

function getProgress(events: RoadmapEventWithStatus[]): number {
  const liveIndex = events.findIndex((event) => event.status === "live");
  if (liveIndex >= 0) return Math.round((liveIndex / (events.length - 1)) * 100);

  const endedCount = events.filter((event) => event.status === "ended").length;
  if (endedCount === 0) return 0;
  if (endedCount === events.length) return 100;
  return Math.round(((endedCount - 1) / (events.length - 1)) * 100);
}

export function DailyHero({ radar }: { radar: DailyRadarDTO }) {
  const referenceDate = getReferenceDate(radar.date);
  const year = referenceDate.getFullYear();
  const dateStr = referenceDate.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const events = AI_ROADMAP_EVENTS.map((event) => ({
    ...event,
    status: getStatus(event, year, referenceDate),
  }));

  const counts = events.reduce(
    (acc, event) => {
      acc[event.status] += 1;
      return acc;
    },
    { ended: 0, live: 0, upcoming: 0 } satisfies Record<EventStatus, number>,
  );

  const progressStyle = {
    "--roadmap-progress": `${getProgress(events)}%`,
  } as CSSProperties;
  const focusEvent =
    events.find((event) => event.status === "live") ??
    events.find((event) => event.status === "upcoming") ??
    events.at(-1);

  return (
    <header className="mcm-panel ai-roadmap-hero compact overflow-visible p-4 md:p-5">
      <div className="ai-roadmap-layout">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="section-kicker">AI Roadmap</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold text-[var(--walnut)]">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {year} · {dateStr}
                </span>
              </div>
              <h1 className="mt-2 text-[1.35rem] font-black leading-tight text-[var(--foreground)] md:text-[1.65rem]">
                年度 AI 关键节点
              </h1>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
              <span className="ai-roadmap-counter" data-status="ended">
                已结束 {counts.ended}
              </span>
              <span className="ai-roadmap-counter" data-status="live">
                进行中 {counts.live}
              </span>
              <span className="ai-roadmap-counter" data-status="upcoming">
                未开始 {counts.upcoming}
              </span>
            </div>
          </div>

          <nav className="ai-roadmap-track compact" style={progressStyle} aria-label={`${year} AI 关键节点`}>
            <div className="ai-roadmap-rail" aria-hidden="true" />
            <ol className="ai-roadmap-list">
              {events.map((event) => (
                <li className="ai-roadmap-node" data-status={event.status} key={event.name}>
                  <a
                    className="ai-roadmap-link"
                    href={event.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${event.name}，${STATUS_META[event.status].label}，打开官方页面`}
                  >
                    <span className="ai-roadmap-dot" aria-hidden="true" />
                    <span className="ai-roadmap-label">
                      <span className="ai-roadmap-date">{event.label}</span>
                      <span className="ai-roadmap-name">{event.name}</span>
                    </span>
                    <RoadmapPopover event={event} />
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {focusEvent && (
          <a
            className="ai-roadmap-focus-card"
            data-status={focusEvent.status}
            href={focusEvent.href}
            target="_blank"
            rel="noreferrer"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] font-black uppercase text-[var(--walnut)]">
                <Route className="h-3.5 w-3.5" aria-hidden="true" />
                当前焦点
              </span>
              <StatusPill status={focusEvent.status} />
            </span>
            <span className="mt-3 block text-[1.05rem] font-black leading-tight text-[var(--foreground)]">
              {focusEvent.name}
            </span>
            <span className="mt-1 block font-mono text-[11px] font-bold text-[var(--walnut)]">
              {focusEvent.label} · {focusEvent.location}
            </span>
            <span className="mt-2 block text-[12px] font-bold text-[var(--accent-strong)]">
              {focusEvent.category}
            </span>
            <span className="mt-1.5 block text-[12px] leading-relaxed text-[var(--foreground)]/78">
              {focusEvent.signal}
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[var(--accent-strong)]">
              打开官方页面
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </a>
        )}
      </div>
    </header>
  );
}

function StatusPill({ status }: { status: EventStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <span className="ai-roadmap-status" data-status={status}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function RoadmapPopover({ event }: { event: RoadmapEventWithStatus }) {
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
