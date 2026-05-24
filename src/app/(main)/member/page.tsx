import Link from "next/link";
import { ArrowRight, Archive, Search, Users } from "lucide-react";
import { logMemberAccess } from "@/lib/member-access-log";
import { requireActiveSubscription } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const entries = [
  {
    title: "会员资料库",
    text: "整理过的文档、清单和模板。",
    href: "/member/resources",
    icon: Archive,
  },
  {
    title: "会员搜索",
    text: "通过服务端搜索接口查询可访问内容。",
    href: "/member/search",
    icon: Search,
  },
  {
    title: "会员群组",
    text: "按订阅方案生成短时邀请码。",
    href: "/member/groups",
    icon: Users,
  },
];

export default async function MemberPage() {
  const user = await requireActiveSubscription();
  await logMemberAccess({ action: "visit_member", userId: user.id, targetId: "/member" });

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Member Channel</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          会员首页
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          欢迎回来，{user.name}。这里的资料、搜索和群组入口都需要订阅有效后才能访问。
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <Link key={entry.href} href={entry.href} className="mcm-card group p-6">
              <Icon className="h-7 w-7 text-[color:var(--accent-strong)]" />
              <h2 className="mt-4 text-xl font-black text-[color:var(--foreground)]">
                {entry.title}
              </h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">
                {entry.text}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[color:var(--accent-strong)]">
                进入
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
