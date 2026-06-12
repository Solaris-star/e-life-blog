import Link from "next/link";
import { confirmMemberEmailChange } from "@/lib/member-service";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function VerifyEmailChangePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const result = params.token ? await confirmMemberEmailChange(params.token) : { ok: false as const, error: "invalid" as const };
  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      <section className="mcm-panel space-y-5 p-7 md:p-10">
        <p className="section-kicker">Account</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-5xl">确认新邮箱</h1>
        <p className="font-bold leading-8 text-[color:var(--walnut)]">
          {result.ok ? "邮箱已更新，请重新登录。" : result.error === "exists" ? "这个邮箱已经被使用。" : "确认链接无效或已过期。"}
        </p>
        <Link href={result.ok ? "/login" : "/account"} className="mcm-button mcm-button-primary">
          {result.ok ? "去登录" : "返回账户"}
        </Link>
      </section>
    </div>
  );
}
