import Link from "next/link";
import { ArrowRight, Archive, Boxes, Search, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/member-auth";

const benefits = [
  { title: "资料库", text: "整理过的文档、清单和模板。", icon: Archive },
  { title: "会员搜索", text: "只搜索你有权限访问的会员内容。", icon: Search },
  { title: "群组入口", text: "短时邀请码进入小范围交流。", icon: Users },
  { title: "项目资料", text: "项目记录、扩展 Daily 和实践材料。", icon: Boxes },
];

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function SubscribePage() {
  const user = await getCurrentUser();
  const isActive = user?.subscription.status === "active";

  return (
    <div className="archive-sheet overflow-hidden">
      <section className="grid border-b-[3px] border-[color:var(--line)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6 p-6 md:p-9 lg:border-r-[3px] lg:border-[color:var(--line)]">
          <p className="section-kicker">SUBSCRIBE / 订阅频道</p>
          <h1 className="press-title text-[clamp(2.8rem,11vw,6.2rem)] text-[color:var(--foreground)]">
            会员订阅频道
          </h1>
          <p className="max-w-2xl text-base font-bold leading-8 text-[color:var(--foreground)] md:text-lg">
            公开博客继续正常阅读和 RSS 订阅。会员频道放资料库、群组入口、会员搜索和扩展内容。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={isActive ? "/member" : "/register"} className="mcm-button mcm-button-primary bg-[color:var(--accent)]">
              {isActive ? "进入会员频道" : "成为订阅者"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="mcm-button mcm-button-secondary">
              已有账号登录
            </Link>
            <Link href="/account" className="mcm-button mcm-button-secondary">
              查看账户状态
            </Link>
          </div>
        </div>

        <div className="p-5 md:p-8">
          <div className="mcm-panel h-full p-6">
            <p className="mono-label text-sm font-black text-[color:var(--accent-strong)]">
              FILE NO. SUB-2026-001
            </p>
            <div className="mt-8 grid gap-4">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="border-2 border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-[3px_3px_0_var(--ink)]">
                    <Icon className="h-6 w-6 text-[color:var(--accent-strong)]" />
                    <h2 className="mt-3 text-lg font-black text-[color:var(--foreground)]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm font-bold leading-6 text-[color:var(--walnut)]">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
