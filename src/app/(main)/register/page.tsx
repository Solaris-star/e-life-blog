import type { CSSProperties } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { isMemberRegistrationEnabled } from "@/lib/member-feature-flags";
import { registerMember } from "@/lib/member-service";
import { getEnabledOAuthProviders } from "@/lib/member-oauth";
import { createHumanChallenge, shouldChallengeRegistration } from "@/lib/member-human-challenge";
import { getRegistrationRequestMeta } from "@/lib/member-registration-security";
import { OAuthProviderIcon } from "@/components/member/OAuthProviderIcon";
import { PasswordField } from "@/components/member/PasswordField";
import "../login/auth.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function register(formData: FormData) {
  "use server";

  if (!isMemberRegistrationEnabled()) {
    notFound();
  }

  const result = await registerMember({
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
    website: String(formData.get("website") || ""),
    humanAnswer: String(formData.get("humanAnswer") || ""),
    humanChallengeId: String(formData.get("humanChallengeId") || ""),
    turnstileToken: String(formData.get("cf-turnstile-response") || ""),
  });

  if (!result.ok) {
    redirect(`/register?error=${result.error}`);
  }

  redirect(`/account?email=${result.verificationEmail === "sent" ? "verify_sent" : "mail_not_configured"}#account-security`);
}

function getErrorMessage(error?: string) {
  switch (error) {
    case "exists":
      return "这个邮箱已经注册过。";
    case "email_domain_not_allowed":
      return "暂时只开放 163、QQ、Hotmail、Outlook 邮箱注册。";
    case "ip_rate_limited":
    case "email_rate_limited":
    case "fingerprint_rate_limited":
      return "注册太频繁了，稍后再试。";
    case "human_challenge_required":
      return "人机验证不正确，请重新填写。";
    case "honeypot":
      return "注册请求异常。";
    case "invalid":
    default:
      return "请填写有效邮箱，密码至少 8 位，并确认两次密码一致。";
  }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isMemberRegistrationEnabled()) {
    notFound();
  }

  const params = await searchParams;
  const oauthProviders = getEnabledOAuthProviders();
  const needsChallenge = params.error === "human_challenge_required" || await shouldChallengeRegistration(await getRegistrationRequestMeta());
  const challenge = needsChallenge ? await createHumanChallenge("register") : null;

  return (
    <div className="mx-auto w-full max-w-md space-y-6 pb-8">
      <header className="auth-rise mcm-panel space-y-3 p-6 text-center md:p-8">
        <p className="section-kicker justify-center">Register</p>
        <h1 className="press-title text-3xl font-black text-[color:var(--foreground)] md:text-4xl">
          注册账号
        </h1>
        <p className="font-bold leading-7 text-[color:var(--walnut)]">
          支持常用个人邮箱注册。注册后可以进入账户页查看状态。
        </p>
      </header>

      {params.error && (
        <div className="auth-rise mcm-card border-[color:var(--accent)] p-5 text-sm font-bold text-[color:var(--accent-strong)]" style={{ "--auth-i": 1 } as CSSProperties} role="alert">
          {getErrorMessage(params.error)}
        </div>
      )}

      {oauthProviders.length > 0 && (
        <div className="auth-rise mcm-card space-y-3 p-6" style={{ "--auth-i": 2 } as CSSProperties}>
          <p className="mono-label text-xs font-black uppercase tracking-[0.22em] text-[color:var(--walnut)]">第三方注册 / OAuth</p>
          <div className="grid gap-3">
            {oauthProviders.map((provider) => (
              <Link key={provider.id} href={`/api/member/oauth/${provider.id}`} className="mcm-button inline-flex w-full items-center justify-center gap-2">
                <OAuthProviderIcon providerId={provider.id} />
                <span>使用 {provider.label} 注册 / 登录</span>
              </Link>
            ))}
          </div>
          <p className="mono-label text-center text-xs font-bold text-[color:var(--walnut)]">—— 或使用邮箱注册 ——</p>
        </div>
      )}

      <form action={register} className="auth-rise mcm-card space-y-5 p-6 md:p-7" style={{ "--auth-i": 3 } as CSSProperties}>
        <div>
          <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="name">
            账号名
          </label>
          <input id="name" name="name" autoComplete="name" required minLength={2} maxLength={32} className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-bold outline-none focus-visible:border-[color:var(--accent)]" />
          <p className="mt-2 text-xs font-bold text-[color:var(--muted)]">2-32 个字符，建议不要使用真实姓名。</p>
        </div>
        <div>
          <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="email">
            邮箱
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-bold outline-none focus-visible:border-[color:var(--accent)]" />
          <p className="mt-2 text-xs font-bold text-[color:var(--muted)]">仅支持 163、QQ、Hotmail、Outlook 邮箱。</p>
        </div>
        <div>
          <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="password">
            密码
          </label>
          <PasswordField id="password" name="password" autoComplete="new-password" minLength={8} />
          <p className="mt-2 text-xs font-bold text-[color:var(--muted)]">至少 8 位，建议包含大小写字母和数字。</p>
        </div>
        <div>
          <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="confirmPassword">
            确认密码
          </label>
          <PasswordField id="confirmPassword" name="confirmPassword" autoComplete="new-password" minLength={8} />
        </div>
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        {challenge && (
          challenge.provider === "turnstile" ? (
            <div className="space-y-3">
              <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
              <div className="cf-turnstile" data-sitekey={challenge.siteKey} />
              <p className="text-xs font-bold text-[color:var(--muted)]">当前注册请求较频繁，需要先通过 Cloudflare Turnstile 验证。</p>
            </div>
          ) : (
            <div>
              <input type="hidden" name="humanChallengeId" value={challenge.id} />
              <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="humanAnswer">
                人机验证：{challenge.question}
              </label>
              <input id="humanAnswer" name="humanAnswer" inputMode="numeric" autoComplete="off" required className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-bold outline-none focus-visible:border-[color:var(--accent)]" />
              <p className="mt-2 text-xs font-bold text-[color:var(--muted)]">备用验证。配置 Turnstile 后会自动切换。</p>
            </div>
          )
        )}
        <button type="submit" className="mcm-button mcm-button-primary w-full">
          注册并登录
        </button>
        <div className="text-center">
          <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-black text-[color:var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]">
            已有账号，去登录
          </Link>
        </div>
      </form>

      <p className="auth-rise mono-label text-center text-xs font-bold leading-5 text-[color:var(--walnut)]" style={{ "--auth-i": 4 } as CSSProperties}>
        密码加密存储 · 仅用于登录验证 · 不向第三方共享你的数据
      </p>
    </div>
  );
}
