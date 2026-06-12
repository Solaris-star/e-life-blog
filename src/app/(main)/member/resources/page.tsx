import Link from "next/link";
import { Download, FileText, Lock } from "lucide-react";
import { Reveal } from "@/components/layout/Reveal";
import { requireActiveSubscription } from "@/lib/member-auth";
import { logMemberAccess } from "@/lib/member-access-log";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "zip" | "video" | "other";
  size: string;
  access: "free" | "basic" | "pro";
  url: string;
  downloadCount?: number;
}

// 示例资源数据（实际应从数据库或配置文件读取）
const resources: Resource[] = [
  {
    id: "res-001",
    title: "AI 研究论文合集 2025",
    description: "精选 50 篇 2025 年最新 AI 研究论文，涵盖 LLM、多模态、强化学习等前沿方向。",
    type: "pdf",
    size: "128 MB",
    access: "pro",
    url: "https://pan.quark.cn/s/example-ai-papers-2025",
    downloadCount: 42,
  },
  {
    id: "res-002",
    title: "开发工具配置模板",
    description: "VS Code、Cursor、JetBrains 等开发工具的优化配置模板和插件推荐列表。",
    type: "zip",
    size: "5.2 MB",
    access: "basic",
    url: "https://pan.quark.cn/s/example-dev-templates",
    downloadCount: 156,
  },
  {
    id: "res-003",
    title: "博客系统部署指南",
    description: "本博客系统的完整部署教程，包括 Docker、Caddy、Cloudflare 配置。",
    type: "pdf",
    size: "12 MB",
    access: "free",
    url: "https://pan.quark.cn/s/example-deploy-guide",
    downloadCount: 89,
  },
];

const typeIcons = {
  pdf: FileText,
  zip: Download,
  video: FileText,
  other: FileText,
};

const accessLabels: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  pro: "Pro",
};

const accessOrder: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
};

function canAccess(userPlan: string, resourceAccess: string): boolean {
  const userLevel = accessOrder[userPlan] ?? -1;
  const resourceLevel = accessOrder[resourceAccess] ?? 999;
  return userLevel >= resourceLevel || userPlan === "lifetime";
}

export default async function MemberResourcesPage() {
  const user = await requireActiveSubscription();
  await logMemberAccess({ action: "view_resource", userId: user.id, targetId: "/member/resources" });

  const accessibleResources = resources.filter((res) => canAccess(user.plan, res.access));
  const lockedResources = resources.filter((res) => !canAccess(user.plan, res.access));

  return (
    <div className="space-y-8 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Member Resources</p>
        <h1 className="press-title text-4xl font-black text-[color:var(--foreground)] md:text-6xl">会员资源</h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          下载专属资源包和文档。当前等级：{user.plan.toUpperCase()}。
        </p>
      </header>

      {accessibleResources.length > 0 && (
        <section className="space-y-4">
          <SectionHeading title="可访问资源" kicker="Unlocked" count={accessibleResources.length} />
          <div className="grid gap-4 md:grid-cols-2">
            {accessibleResources.map((resource, index) => {
              const Icon = typeIcons[resource.type];
              return (
                <Reveal key={resource.id} index={index} className="min-w-0">
                  <div className="mcm-card group h-full p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--accent)] text-[color:var(--paper-light)] shadow-[2px_2px_0_var(--ink)]">
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-black text-[color:var(--foreground)]">{resource.title}</h3>
                          <p className="mono-label text-sm font-bold text-[color:var(--walnut)]">{resource.size}</p>
                        </div>
                      </div>
                      <span className="mcm-tag shrink-0 border-[color:var(--accent)] text-[color:var(--accent-strong)]">
                        {accessLabels[resource.access]}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-bold leading-6 text-[color:var(--walnut)]">
                      {resource.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="mono-label text-xs font-bold text-[color:var(--walnut)]">
                        {resource.downloadCount ? `${resource.downloadCount} 次下载` : "暂无下载"}
                      </span>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mcm-button mcm-button-primary inline-flex items-center gap-2 text-sm"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        下载
                      </a>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {lockedResources.length > 0 && (
        <section className="space-y-4">
          <SectionHeading title="需要更高等级" kicker="Locked" count={lockedResources.length} />
          <div className="grid gap-4 md:grid-cols-2">
            {lockedResources.map((resource, index) => {
              const Icon = typeIcons[resource.type];
              return (
                <Reveal key={resource.id} index={index} className="min-w-0">
                  <div className="mcm-card h-full border-dashed p-5 opacity-75">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface-muted)] text-[color:var(--walnut)] shadow-[2px_2px_0_var(--ink)]">
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-black text-[color:var(--foreground)]">{resource.title}</h3>
                          <p className="mono-label text-sm font-bold text-[color:var(--walnut)]">{resource.size}</p>
                        </div>
                      </div>
                      <Lock className="h-5 w-5 shrink-0 text-[color:var(--accent)]" aria-hidden="true" />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="mcm-tag border-[color:var(--accent)] text-[color:var(--accent-strong)]">
                        按等级解锁 · {accessLabels[resource.access]}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-bold leading-6 text-[color:var(--walnut)]">
                      {resource.description}
                    </p>

                    <div className="mt-4">
                      <Link href="/subscribe" className="mcm-button mcm-button-secondary inline-block text-sm">
                        升级到 {accessLabels[resource.access]}
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {accessibleResources.length === 0 && lockedResources.length === 0 && (
        <div className="mcm-card p-8 text-center">
          <p className="font-bold text-[color:var(--walnut)]">暂无可用资源。</p>
          <p className="mt-2 text-sm text-[color:var(--walnut)]">资源会随着内容更新逐步上线。</p>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, kicker, count }: { title: string; kicker: string; count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="text-xl font-black text-[color:var(--foreground)] md:text-2xl">{title}</h2>
      <span className="mono-label text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[color:var(--walnut)]">
        {kicker} · {count}
      </span>
      <span className="hidden h-[2px] min-w-8 flex-1 bg-[color:var(--line)] sm:block" aria-hidden="true" />
    </div>
  );
}
