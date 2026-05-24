import Link from "next/link";
import { getCurrentUser } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AccountPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Account</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          账户与订阅状态
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          查看当前登录状态和订阅状态。会员内容不会出现在公开搜索、RSS 或静态页面里。
        </p>
      </header>

      <section className="mcm-card p-6 md:p-7">
        {user ? (
          <div className="space-y-4">
            <p className="text-xl font-black text-[color:var(--foreground)]">{user.name}</p>
            <p className="font-bold text-[color:var(--walnut)]">{user.email}</p>
            <div className="flex flex-wrap gap-3">
              <span className="mcm-tag">plan: {user.plan}</span>
              <span className="mcm-tag">subscription: {user.subscription.status}</span>
              {user.subscription.renewsAt && <span className="mcm-tag">renews: {user.subscription.renewsAt}</span>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-bold leading-7 text-[color:var(--walnut)]">
              当前未登录。
            </p>
            <Link href="/login" className="mcm-button mcm-button-primary">
              去登录
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
