import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/layout/Reveal";
import ClientGardenStage from "@/components/garden/ClientGardenStage";
import { getCurrentUser } from "@/lib/member-auth";
import { canReadPost } from "@/lib/post-access";

export const dynamic = "force-dynamic";

export interface Friend {
  name: string;
  url: string;
  description: string;
  logoSrc: string;
  logoAlt: string;
  inviteUrl?: string;
  inviteNote?: string;
  tooltipText?: string;
  extraUrl?: string;
  extraUrlText?: string;
}

const forums: Friend[] = [
  {
    name: "L 站",
    url: "https://linux.do/",
    description: "Linux.do 社区",
    logoSrc: "/images/friends/linuxdo-icon.png",
    logoAlt: "Linux.do 图标",
    inviteUrl: "https://invite.linuxdo.org/",
    inviteNote: "国内直连，不要挂 VPN",
    tooltipText: "该自助邀请码需要5年GitHub账号才能使用，直接加入L站，无需写小作文。",
    extraUrl: "https://xyl1null.github.io/GittyAge/",
    extraUrlText: "GitHub账号年限"
  }
];

const tools: Friend[] = [
  {
    name: "AI 比价雷达",
    url: "https://aiprice.sovoice.asia/",
    description: "AI 资源全网比价 — ChatGPT、Claude、Grok 账号与订阅实时价格对比",
    logoSrc: "/images/friends/aiprice-icon.svg",
    logoAlt: "AI 比价雷达 图标"
  },
  {
    name: "App Store 比价工具",
    url: "https://appstoreprice.org/zh/apps",
    description: "跨区 App Store 价格对比 — 找出最划算的地区购买应用",
    logoSrc: "/images/friends/tool-default-icon.svg",
    logoAlt: "App Store 比价工具 图标"
  },
  {
    name: "OpenAI 接码比价",
    url: "https://sms.fur.li/",
    description: "OpenAI SMS 接码价格对比 — 各平台接码服务比价",
    logoSrc: "/images/friends/tool-default-icon.svg",
    logoAlt: "OpenAI 接码比价 图标"
  }
];

const getResourcePacks = (): Friend[] => {
  const packs: Friend[] = [];

  for (const index of [1, 2, 3, 4, 5]) {
    const quarkUrl = process.env[`PRO_RESOURCE_PACK_${index}_QUARK_URL`];
    const quarkCode = process.env[`PRO_RESOURCE_PACK_${index}_QUARK_CODE`];
    const name = process.env[`PRO_RESOURCE_PACK_${index}_NAME`] || `精选资源包 ${index}`;
    const description = process.env[`PRO_RESOURCE_PACK_${index}_DESCRIPTION`] || "整理好的工具、资料、模板与订阅相关资源，不定期更新";

    if (!quarkUrl || !quarkCode) continue;

    packs.push({
      name,
      url: quarkUrl,
      description,
      logoSrc: "/images/friends/tool-default-icon.svg",
      logoAlt: `${name} 图标`,
      inviteNote: `提取码：${quarkCode}`
    });
  }

  return packs;
};

export default async function ResourcesPage() {
  const user = await getCurrentUser();
  const canViewResourcePacks = canReadPost(user, "pro");
  const resourcePacks = canViewResourcePacks ? getResourcePacks() : [];

  return (
    <div className="space-y-10 pb-8">
      <ClientGardenStage page="resources" />
      <header className="mcm-panel relative overflow-hidden p-7 md:p-10">
        <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full border-[18px] border-[color:rgb(217_118_66_/_28%)] md:block" />
        <div className="space-y-4">
          <p className="section-kicker">Resources</p>
          <h1 className="press-title text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
            实用资源
          </h1>
          <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
            精选好用的工具与社区，收录我日常使用的优质资源。
          </p>
        </div>
      </header>

      <section>
        <SectionHeading title="论坛" kicker="Forums" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {forums.map((friend, index) => (
            <Reveal key={friend.name} index={index} className="min-w-0">
              <FriendCard friend={friend} />
            </Reveal>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="实用工具" kicker="Tools" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((friend, index) => (
            <Reveal key={friend.name} index={index} className="min-w-0">
              <FriendCard friend={friend} />
            </Reveal>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="精选资源包"
          kicker="Pro Packs"
          badge={
            <span className="mcm-tag border-[color:var(--accent)] text-[color:var(--accent-strong)]">
              PRO 专享
            </span>
          }
        />
        {canViewResourcePacks ? (
          <div className="rounded-[4px] border-2 border-[color:var(--accent)] bg-[color:var(--surface-muted)] p-4 shadow-[3px_3px_0_var(--ink)] md:p-5">
            {resourcePacks.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {resourcePacks.map((friend, index) => (
                  <Reveal key={friend.name} index={index} className="min-w-0">
                    <FriendCard friend={friend} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="p-2 text-sm font-bold leading-6 text-[color:var(--walnut)]">
                资源包整理中，上线后会出现在这里。
              </p>
            )}
          </div>
        ) : (
          <Reveal>
            <div className="rounded-[4px] border-2 border-[color:var(--accent)] bg-[color:var(--surface)] p-5 shadow-[3px_3px_0_var(--ink)] md:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-lg font-black text-[color:var(--foreground)]">Pro 会员资源</p>
                <span className="mcm-tag border-[color:var(--accent)] text-[color:var(--accent-strong)]">按等级解锁</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--walnut)]">
                精选资源包仅对 Pro 及以上会员开放。
              </p>
              <Link
                href={user ? "/subscribe" : "/login?next=/resources"}
                className="mt-4 inline-flex min-h-11 items-center border-b-2 border-[color:var(--accent)] text-sm font-black text-[color:var(--accent-strong)] hover:border-[color:var(--line)] hover:text-[color:var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
              >
                {user ? "查看会员方案" : "登录后查看"}
              </Link>
            </div>
          </Reveal>
        )}
      </section>
    </div>
  );
}

function SectionHeading({ title, kicker, badge }: { title: string; kicker: string; badge?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <h2 className="text-xl font-black text-[color:var(--foreground)] md:text-2xl">{title}</h2>
      <span className="mono-label text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[color:var(--walnut)]">
        {kicker}
      </span>
      {badge}
      <span className="hidden h-[2px] min-w-8 flex-1 bg-[color:var(--line)] sm:block" aria-hidden="true" />
    </div>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  return (
    <div className="mcm-card group flex h-full items-center gap-5 p-5">
      <Image
        src={friend.logoSrc}
        alt={friend.logoAlt}
        width={72}
        height={72}
        className="h-12 w-12 shrink-0 object-contain"
      />
      <div className="min-w-0 flex-1">
        <a
          href={friend.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-lg font-black text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
        >
          {friend.name}
        </a>
        <p className="truncate text-sm text-[color:var(--walnut)]">
          {friend.description}
        </p>
        {friend.inviteUrl && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <a
              href={friend.inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit max-w-full border-b-2 border-[color:var(--accent)] text-sm font-black text-[color:var(--accent-strong)] hover:border-[color:var(--line)] hover:text-[color:var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
            >
              自助邀请码
            </a>
            {friend.tooltipText && (
              <details className="group/tip relative inline-flex">
                <summary
                  className="-m-3 inline-flex cursor-help list-none items-center justify-center p-3 text-[color:var(--walnut)] transition-colors hover:text-[color:var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-[color:var(--accent)] [&::-webkit-details-marker]:hidden"
                  aria-label="查看邀请码说明"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </summary>
                <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 whitespace-normal rounded-md border-2 border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2 text-xs font-bold leading-5 text-[color:var(--foreground)] opacity-0 shadow-[3px_3px_0_var(--ink)] transition-opacity duration-150 group-hover/tip:opacity-100 group-open/tip:opacity-100 group-focus-within/tip:opacity-100">
                  {friend.tooltipText}
                </span>
              </details>
            )}
            {friend.extraUrl && friend.extraUrlText && (
              <>
                <span className="text-xs text-[color:var(--walnut)]">|</span>
                <a
                  href={friend.extraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit max-w-full border-b-2 border-[color:var(--accent)] text-sm font-black text-[color:var(--accent-strong)] hover:border-[color:var(--line)] hover:text-[color:var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
                >
                  {friend.extraUrlText}
                </a>
              </>
            )}
          </div>
        )}
        {friend.inviteNote && (
          <p className="mono-label mt-1 text-xs font-bold leading-5 text-[color:var(--walnut)]">
            {friend.inviteNote}
          </p>
        )}
      </div>
    </div>
  );
}
