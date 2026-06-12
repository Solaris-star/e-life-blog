import Link from "next/link";
import { ArrowRight, BookOpen, Crown, LockKeyhole, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/member-auth";

const benefits = [
  { title: "公开文章", text: "现有博客内容继续免费阅读，不登录也能看。", icon: BookOpen },
  { title: "登录会员", text: "解锁标记为 free 的会员文章。", icon: UserRound },
  { title: "Basic / Pro", text: "按等级解锁更深入的文章正文。", icon: LockKeyhole },
  { title: "Lifetime", text: "保留最高等级文章的长期访问权。", icon: Crown },
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
            会员文章订阅
          </h1>
          <p className="max-w-2xl text-base font-bold leading-8 text-[color:var(--foreground)] md:text-lg">
            公开博客继续正常阅读。会员体系暂时只用于文章正文分级解锁；其它未完成模块会等真实内容接好后再开放。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={isActive ? "/member" : "/register"} className="mcm-button mcm-button-primary bg-[color:var(--accent)]">
              {isActive ? "进入会员文章" : "注册会员账号"}
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
              ARTICLE ACCESS LEVELS
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
