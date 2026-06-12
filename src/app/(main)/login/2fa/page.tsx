import { redirect } from "next/navigation";
import Link from "next/link";
import { completeTwoFactorChallenge, getTwoFactorChallenge } from "@/lib/member-auth";
import { normalizeNextPath } from "@/lib/member-oauth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function verifyTwoFactor(formData: FormData) {
  "use server";

  const nextPath = normalizeNextPath(String(formData.get("next") || ""));
  const result = await completeTwoFactorChallenge(String(formData.get("token") || ""));
  if (!result.ok) {
    redirect(`/login/2fa?error=${result.error}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`);
  }

  redirect(nextPath || result.nextPath || (result.user.subscription.status === "active" || result.user.plan === "lifetime" ? "/member" : "/account"));
}

export default async function TwoFactorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const challenge = await getTwoFactorChallenge();
  const params = await searchParams;
  const nextPath = normalizeNextPath(params.next) || challenge?.nextPath || "";

  if (!challenge) {
    redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">2FA</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          两步验证
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          输入 Authenticator 里的 6 位验证码。
        </p>
      </header>

      {params.error && (
        <div className="mcm-card border-[color:var(--accent)] p-5 text-sm font-bold text-[color:var(--accent-strong)]">
          验证码不对或已过期。
        </div>
      )}

      <form action={verifyTwoFactor} className="mcm-card space-y-5 p-6 md:p-7">
        <input type="hidden" name="next" value={nextPath} />
        <div>
          <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="token">
            验证码
          </label>
          <input id="token" name="token" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" required className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-bold outline-none" />
        </div>
        <button type="submit" className="mcm-button mcm-button-primary">
          验证并登录
        </button>
      </form>

      <Link href="/login" className="inline-flex text-sm font-black text-[color:var(--accent-strong)]">
        返回登录
      </Link>
    </div>
  );
}
