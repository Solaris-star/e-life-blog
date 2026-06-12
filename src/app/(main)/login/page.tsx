import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { getCurrentUser } from "@/lib/member-auth";
import { isMemberRegistrationEnabled } from "@/lib/member-feature-flags";
import { loginMember } from "@/lib/member-service";
import { getEnabledOAuthProviders } from "@/lib/member-oauth";
import { createHumanChallenge, shouldChallengeLogin } from "@/lib/member-human-challenge";
import { getLoginRequestMeta } from "@/lib/member-login-security";
import { OAuthProviderIcon } from "@/components/member/OAuthProviderIcon";
import { PasswordField } from "@/components/member/PasswordField";
import "./auth.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function login(formData: FormData) {
  "use server";

  const nextPath = normalizeNextPath(String(formData.get("next") || ""));
  const result = await loginMember({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    nextPath,
    humanAnswer: String(formData.get("humanAnswer") || ""),
    humanChallengeId: String(formData.get("humanChallengeId") || ""),
    turnstileToken: String(formData.get("cf-turnstile-response") || ""),
  });

  if (!result.ok) {
    if (result.error === "two_factor_required") {
      redirect(`/login/2fa${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
    }
    const suffix = nextPath ? `&next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login?error=${result.error}${suffix}`);
  }

  redirect(nextPath || (result.user.subscription.status === "active" || result.user.plan === "lifetime" ? "/member" : "/account"));
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const nextPath = normalizeNextPath(params.next);
  const oauthProviders = getEnabledOAuthProviders();
  const needsChallenge = params.error === "human_challenge_required" || await shouldChallengeLogin(await getLoginRequestMeta());
  const challenge = needsChallenge ? await createHumanChallenge("login") : null;

  return (
    <div className="mx-auto w-full max-w-md space-y-6 pb-8">
      <header className="auth-rise mcm-panel space-y-3 p-6 text-center md:p-8">
        <p className="section-kicker justify-center">Login</p>
        <h1 className="press-title text-3xl font-black text-[color:var(--foreground)] md:text-4xl">
          登录
        </h1>
        <p className="font-bold leading-7 text-[color:var(--walnut)]">
          登录后可以查看账户状态和会员内容。
        </p>
      </header>

      {user && (
        <div className="auth-rise mcm-card p-5 text-sm font-bold leading-7 text-[color:var(--walnut)]" style={{ "--auth-i": 1 } as CSSProperties}>
          当前已登录：{user.email}。
          <Link href="/account" className="ml-2 font-black text-[color:var(--accent-strong)]">
            查看账户
          </Link>
        </div>
      )}

      {params.error && (
        <div className="auth-rise mcm-card border-[color:var(--accent)] p-5 text-sm font-bold text-[color:var(--accent-strong)]" style={{ "--auth-i": 1 } as CSSProperties} role="alert">
          {loginErrorMessage(params.error)}
        </div>
      )}

      {oauthProviders.length > 0 && (
        <div className="auth-rise mcm-card space-y-3 p-6" style={{ "--auth-i": 2 } as CSSProperties}>
          <p className="mono-label text-xs font-black uppercase tracking-[0.22em] text-[color:var(--walnut)]">第三方登录 / OAuth</p>
          <div className="grid gap-3">
            {oauthProviders.map((provider) => (
              <Link key={provider.id} href={`/api/member/oauth/${provider.id}${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="mcm-button inline-flex w-full items-center justify-center gap-2">
                <OAuthProviderIcon providerId={provider.id} />
                <span>使用 {provider.label} 登录</span>
              </Link>
            ))}
          </div>
          <p className="mono-label text-center text-xs font-bold text-[color:var(--walnut)]">—— 或使用邮箱登录 ——</p>
        </div>
      )}

      <form action={login} className="auth-rise mcm-card space-y-5 p-6 md:p-7" style={{ "--auth-i": 3 } as CSSProperties}>
        <input type="hidden" name="next" value={nextPath} />
        <div>
          <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="email">
            邮箱
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-bold outline-none focus-visible:border-[color:var(--accent)]" />
        </div>
        <div>
          <label className="block text-sm font-black text-[color:var(--foreground)]" htmlFor="password">
            密码
          </label>
          <PasswordField id="password" name="password" autoComplete="current-password" />
        </div>
        {challenge && (
          challenge.provider === "turnstile" ? (
            <div className="space-y-3">
              <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
              <div className="cf-turnstile" data-sitekey={challenge.siteKey} />
              <p className="text-xs font-bold text-[color:var(--muted)]">当前 IP 请求较频繁，需要先通过 Cloudflare Turnstile 验证。</p>
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
          登录
        </button>
        <div className="flex items-center justify-between gap-3">
          <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-black text-[color:var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]">
            忘记密码
          </Link>
          {isMemberRegistrationEnabled() && (
            <Link href="/register" className="inline-flex min-h-11 items-center text-sm font-black text-[color:var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]">
              还没有账号，去注册
            </Link>
          )}
        </div>
      </form>

      <p className="auth-rise mono-label text-center text-xs font-bold leading-5 text-[color:var(--walnut)]" style={{ "--auth-i": 4 } as CSSProperties}>
        密码加密存储 · 支持两步验证 · 不向第三方共享你的数据
      </p>
    </div>
  );
}

function loginErrorMessage(error?: string) {
  if (error === "missing") return "请填写邮箱和密码。";
  if (error === "disabled") return "这个账号已被禁用。";
  if (error === "human_challenge_required") return "请求太频繁，请完成人机验证后再登录。";
  if (
    error === "ip_login_rate_limited" ||
    error === "email_login_rate_limited" ||
    error === "fingerprint_login_rate_limited"
  ) {
    return "登录尝试太频繁了，稍后再试。";
  }
  return "邮箱或密码不正确。";
}

function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";
  if (value.startsWith("/login") || value.startsWith("/register") || value.startsWith("/api/")) return "";
  return value;
}
