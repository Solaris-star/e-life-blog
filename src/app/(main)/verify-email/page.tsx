import Link from "next/link";
import { verifyMemberEmail } from "@/lib/member-service";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const ok = params.token ? await verifyMemberEmail(params.token) : false;
  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      <section className="mcm-panel space-y-5 p-7 md:p-10">
        <p className="section-kicker">Account</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-5xl">邮箱验证</h1>
        <p className="font-bold leading-8 text-[color:var(--walnut)]">
          {ok ? "邮箱已验证。" : "验证链接无效或已过期。"}
        </p>
        <Link href="/account" className="mcm-button mcm-button-primary">返回账户</Link>
      </section>
    </div>
  );
}
