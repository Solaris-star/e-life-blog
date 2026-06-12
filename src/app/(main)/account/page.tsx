import Link from "next/link";
import QRCode from "qrcode";
import { ArrowRight, Crown } from "lucide-react";
import { Reveal } from "@/components/layout/Reveal";
import { getCurrentUser } from "@/lib/member-auth";
import { getPosts } from "@/lib/content";
import { getMemberPostActivities, type MemberPostActivityType } from "@/lib/member-post-activity";
import { changePasswordAction, confirmTwoFactorSetup, disableTwoFactor, getTwoFactorSetupUri, redeemCodeAction, requestEmailChangeAction, resendVerificationEmailAction, startTwoFactorSetup } from "./actions";

function isTwoFactorSetupExpired(expiresAt?: string) {
  if (!expiresAt) return true;
  const timestamp = Date.parse(expiresAt);
  return Number.isNaN(timestamp) || timestamp <= Date.now();
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ twoFactor?: string; redeem?: string; plan?: string; email?: string; password?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const canEnterMemberArea = user && user.accountStatus !== "disabled" && (user.subscription.status === "active" || user.plan === "lifetime");
  const postCollections = user ? await getAccountPostCollections(user.id) : { bookmarks: [], readLater: [], history: [] };
  const readingTotal = postCollections.bookmarks.length + postCollections.readLater.length + postCollections.history.length;
  const showTwoFactorSetup = params.twoFactor === "setup" || params.twoFactor === "invalid";
  const hasValidTwoFactorSetup = showTwoFactorSetup && !user?.twoFactor?.enabled && !isTwoFactorSetupExpired(user?.twoFactor?.setupExpiresAt);
  const twoFactorStatus = showTwoFactorSetup && !hasValidTwoFactorSetup && !user?.twoFactor?.enabled ? "expired" : params.twoFactor;
  const twoFactorSecret = hasValidTwoFactorSetup ? user?.twoFactor?.secret ?? "" : "";
  const twoFactorUri = user && twoFactorSecret ? getTwoFactorSetupUri(user.email, twoFactorSecret) : "";
  const twoFactorQrCode = twoFactorUri
    ? await QRCode.toDataURL(twoFactorUri, { margin: 1, scale: 8, errorCorrectionLevel: "M" })
    : "";
  const emailVerificationState = user as ({ emailVerified?: boolean } | null);
  const emailVerified = emailVerificationState?.emailVerified ?? true;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="mcm-panel overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6 p-6 md:p-9">
            <p className="section-kicker">Account</p>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-black leading-none text-[color:var(--foreground)] md:text-6xl">
                账户中心
              </h1>
              <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
                管理会员状态、阅读记录和关键安全设置。低频操作收起来，别一进来就像填表考试。
              </p>
            </div>
            {user ? (
              <div className="flex flex-wrap gap-3">
                <Link href="/member" className="mcm-button mcm-button-primary">进入会员区</Link>
                <form action="/logout" method="post">
                  <button type="submit" className="mcm-button mcm-button-secondary">退出登录</button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="mcm-button mcm-button-primary">去登录</Link>
            )}
          </div>

          <aside className="border-t-[3px] border-[color:var(--line)] bg-[color:var(--surface)] p-6 md:p-8 lg:border-l-[3px] lg:border-t-0">
            {user ? (
              <div className="space-y-5">
                <div>
                  <p className="text-2xl font-black text-[color:var(--foreground)]">{user.name}</p>
                  <p className="mt-1 break-all text-sm font-bold text-[color:var(--walnut)]">{user.email}</p>
                </div>
                <Reveal stamp>
                  <div className="inline-flex min-h-11 items-center gap-3 rounded-[2px] border-2 border-[color:var(--accent)] bg-[color:var(--paper)] px-4 py-2 shadow-[3px_3px_0_var(--ink)]">
                    <Crown className="h-5 w-5 shrink-0 text-[color:var(--accent-strong)]" aria-hidden="true" />
                    <span className="mono-label text-[0.65rem] font-black uppercase tracking-[0.16em] text-[color:var(--walnut)]">会员等级</span>
                    <span className="text-lg font-black uppercase leading-none text-[color:var(--accent-strong)]">{user.plan}</span>
                  </div>
                </Reveal>
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="订阅" value={user.subscription.status} />
                  <Metric label="邮箱" value={emailVerified ? "已验证" : "未验证"} tone={emailVerified ? "good" : "warn"} />
                  <Metric label="2FA" value={user.twoFactor?.enabled ? "已开启" : "未开启"} tone={user.twoFactor?.enabled ? "good" : "warn"} />
                  <Metric label="阅读" value={`${readingTotal} 条`} />
                </div>
                {!emailVerified && (
                  <p className="border-l-4 border-[color:var(--accent)] pl-4 text-sm font-bold leading-6 text-[color:var(--walnut)]">
                    邮箱还没有验证。邮件服务配置好之前，系统不会假装已经发送验证邮件。
                  </p>
                )}
                {!canEnterMemberArea && (
                  <p className="border-l-4 border-[color:var(--accent)] pl-4 text-sm font-bold leading-6 text-[color:var(--walnut)]">
                    当前账号还没有可用订阅。开通后会显示会员入口。
                  </p>
                )}
              </div>
            ) : (
              <p className="font-bold leading-7 text-[color:var(--walnut)]">当前未登录。</p>
            )}
          </aside>
        </div>
      </header>

      {user && (
        <section id="account-security" className="grid scroll-mt-24 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="min-w-0">
          <div id="two-factor" className="mcm-card h-full scroll-mt-24 space-y-5 p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Security</p>
                <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">账户安全</h2>
              </div>
              <span className="mcm-tag">2FA: {user.twoFactor?.enabled ? "on" : "off"}</span>
            </div>

            {(params.email || params.password || twoFactorStatus) && (
              <p className="border-l-4 border-[color:var(--accent)] pl-4 text-sm font-black text-[color:var(--accent-strong)]">
                {twoFactorStatus ? twoFactorMessage(twoFactorStatus) : accountSecurityMessage(params.email, params.password)}
              </p>
            )}

            <div className="space-y-4 border-2 border-[color:var(--line)] bg-[color:var(--surface)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[color:var(--foreground)]">两步验证</h3>
                  <p className="mt-1 text-sm font-bold leading-6 text-[color:var(--walnut)]">
                    {user.twoFactor?.enabled ? "已保护登录。" : "建议开启，比改密码更有用。"}
                  </p>
                </div>
              </div>

              {user.twoFactor?.enabled ? (
                <form action={disableTwoFactor} className="flex flex-col gap-3 sm:flex-row">
                  <input name="token" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="6 位验证码" required className="min-h-12 flex-1 rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--background)] px-4 font-bold outline-none" />
                  <button type="submit" className="mcm-button mcm-button-secondary">关闭 2FA</button>
                </form>
              ) : twoFactorSecret ? (
                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-[188px_1fr] md:items-start">
                    {twoFactorQrCode && (
                      <div className="border-2 border-[color:var(--line)] bg-white p-3">
                        <img src={twoFactorQrCode} alt="两步验证二维码" width={164} height={164} className="h-40 w-40" />
                      </div>
                    )}
                    <div className="space-y-3">
                      <p className="text-sm font-black text-[color:var(--foreground)]">用 Authenticator 扫码。二维码和密钥 10 分钟有效。</p>
                      <code className="block break-all border-2 border-[color:var(--line)] bg-[color:var(--background)] p-3 text-xs font-black text-[color:var(--foreground)]">{twoFactorSecret}</code>
                      <a href={twoFactorUri} className="inline-flex text-sm font-black text-[color:var(--accent-strong)]">用 Authenticator 打开</a>
                    </div>
                  </div>
                  <form action={confirmTwoFactorSetup} className="flex flex-col gap-3 sm:flex-row">
                    <input name="token" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="输入 6 位验证码" required className="min-h-12 flex-1 rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--background)] px-4 font-bold outline-none" />
                    <button type="submit" className="mcm-button mcm-button-primary">确认启用</button>
                  </form>
                </div>
              ) : (
                <form action={startTwoFactorSetup}>
                  <button type="submit" className="mcm-button mcm-button-primary">绑定 Authenticator</button>
                </form>
              )}
            </div>

            <details className="group border-2 border-[color:var(--line)] bg-[color:var(--surface)] p-4">
              <summary className="cursor-pointer text-lg font-black text-[color:var(--foreground)]">邮箱与密码设置</summary>
              <div className="mt-4 grid gap-4">
                <div className="flex flex-col gap-3 border-t-2 border-[color:var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-black text-[color:var(--foreground)]">邮箱验证</h3>
                    <p className="text-sm font-bold text-[color:var(--walnut)]">当前状态：{emailVerified ? "已验证" : "未验证"}</p>
                  </div>
                  {!emailVerified && (
                    <form action={resendVerificationEmailAction}>
                      <button type="submit" className="mcm-button mcm-button-secondary">发送验证邮件</button>
                    </form>
                  )}
                </div>
                <form action={changePasswordAction} className="grid gap-3 border-t-2 border-[color:var(--line)] pt-4">
                  <h3 className="font-black text-[color:var(--foreground)]">修改密码</h3>
                  {user.passwordHash && <input name="currentPassword" type="password" placeholder="当前密码" autoComplete="current-password" required className="min-h-11 w-full border-2 border-[color:var(--line)] bg-[color:var(--background)] px-3 font-bold outline-none" />}
                  <input name="password" type="password" placeholder="新密码，至少 8 位" autoComplete="new-password" required minLength={8} className="min-h-11 w-full border-2 border-[color:var(--line)] bg-[color:var(--background)] px-3 font-bold outline-none" />
                  <input name="confirmPassword" type="password" placeholder="再次输入新密码" autoComplete="new-password" required minLength={8} className="min-h-11 w-full border-2 border-[color:var(--line)] bg-[color:var(--background)] px-3 font-bold outline-none" />
                  <button type="submit" className="mcm-button mcm-button-secondary">更新密码</button>
                </form>
                <form action={requestEmailChangeAction} className="grid gap-3 border-t-2 border-[color:var(--line)] pt-4">
                  <h3 className="font-black text-[color:var(--foreground)]">修改邮箱</h3>
                  <input name="newEmail" type="email" placeholder="新的邮箱地址" autoComplete="email" required className="min-h-11 w-full border-2 border-[color:var(--line)] bg-[color:var(--background)] px-3 font-bold outline-none" />
                  {user.passwordHash && <input name="currentPassword" type="password" placeholder="当前密码" autoComplete="current-password" required className="min-h-11 w-full border-2 border-[color:var(--line)] bg-[color:var(--background)] px-3 font-bold outline-none" />}
                  <button type="submit" className="mcm-button mcm-button-secondary">发送确认邮件</button>
                </form>
              </div>
            </details>
          </div>
          </Reveal>

          <div className="min-w-0 space-y-6">
            <Reveal index={1}>
            <section className="mcm-card space-y-5 p-6 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-kicker">Reading</p>
                  <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">我的阅读</h2>
                </div>
                <span className="mcm-tag">{readingTotal} 条</span>
              </div>
              {readingTotal > 0 ? (
                <div className="grid gap-4">
                  <PostCollection title="收藏" empty="" posts={postCollections.bookmarks} compact />
                  <PostCollection title="稍后阅读" empty="" posts={postCollections.readLater} compact />
                  <PostCollection title="阅读历史" empty="" posts={postCollections.history} compact />
                </div>
              ) : (
                <div className="border-2 border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-6">
                  <p className="text-lg font-black text-[color:var(--foreground)]">还没有保存的阅读记录。</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[color:var(--walnut)]">读文章时可以收藏、加入稍后读；历史会自动出现在这里。</p>
                  <Link href="/articles" className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-[color:var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]">去看文章 →</Link>
                </div>
              )}
            </section>
            </Reveal>

            <Reveal index={2}>
            <section className="mcm-card space-y-5 p-6 md:p-7">
              <div>
                <p className="section-kicker">Redeem</p>
                <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">兑换会员</h2>
              </div>
              {params.redeem && (
                <p className="border-l-4 border-[color:var(--accent)] pl-4 text-sm font-black text-[color:var(--accent-strong)]">
                  {redeemMessage(params.redeem, params.plan)}
                </p>
              )}
              <form action={redeemCodeAction} className="flex flex-col gap-3 md:flex-row">
                <input name="code" placeholder="输入兑换码" autoComplete="off" required className="min-h-12 flex-1 border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 font-black uppercase outline-none" />
                <button type="submit" className="mcm-button mcm-button-primary">兑换</button>
              </form>
            </section>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  const valueClass = tone === "warn" ? "mt-1 text-lg font-black text-[color:var(--accent-strong)]" : "mt-1 text-lg font-black text-[color:var(--foreground)]";

  return (
    <div className="border-2 border-[color:var(--line)] bg-[color:var(--paper)] p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

function twoFactorMessage(value: string) {
  if (value === "setup") return "二维码和密钥 10 分钟内有效。绑定完成后输入验证码确认。";
  if (value === "expired") return "二维码和密钥已过期，请重新点击绑定 Authenticator。";
  if (value === "invalid") return "验证码不对。";
  if (value === "enabled") return "两步验证已启用。";
  if (value === "disabled") return "两步验证已关闭。";
  if (value === "disable_invalid") return "验证码不对，未关闭两步验证。";
  return "两步验证状态已更新。";
}

function accountSecurityMessage(email?: string, password?: string) {
  if (email === "verify_required") return "请先验证邮箱，再进入会员内容。";
  if (email === "verify_sent") return "验证邮件已发送，请去邮箱点确认链接。";
  if (email === "sent") return "验证邮件已重新发送。";
  if (email === "mail_not_configured") return "还没有配置邮件发送服务，所以验证邮件没有发送。";
  if (email === "change_sent") return "确认邮件已发送到新邮箱。";
  if (email === "exists") return "这个邮箱已经被使用。";
  if (email === "current_password") return "当前密码不对。";
  if (email === "invalid") return "邮箱格式不正确。";
  if (password === "changed") return "密码已更新。";
  if (password === "current_password") return "当前密码不对。";
  if (password === "invalid") return "新密码至少 8 位，且两次输入要一致。";
  return "账户安全状态已更新。";
}

function redeemMessage(value: string, plan?: string) {
  if (value === "success") return `兑换成功，当前账号已开通 ${plan ?? "会员"}。`;
  if (value === "not_found") return "兑换码不存在。";
  if (value === "used") return "这个兑换码已经被使用。";
  if (value === "expired") return "这个兑换码已经过期。";
  return "兑换码无效。";
}

type AccountPostItem = {
  slug: string;
  title: string;
  date: string;
  timestamp: string;
};

async function getAccountPostCollections(userId: string) {
  const posts = getPosts();
  const postBySlug = new Map(posts.map((post) => [post.slug, post]));
  const activities = await getMemberPostActivities(userId);
  return {
    bookmarks: collectPosts("bookmark"),
    readLater: collectPosts("read_later"),
    history: collectPosts("history"),
  };

  function collectPosts(type: MemberPostActivityType) {
    return activities
      .filter((activity) => activity.type === type)
      .sort((left, right) => new Date(right.lastReadAt ?? right.updatedAt).getTime() - new Date(left.lastReadAt ?? left.updatedAt).getTime())
      .map((activity) => {
        const post = postBySlug.get(activity.slug);
        if (!post) return null;
        return {
          slug: post.slug,
          title: post.meta.title,
          date: post.meta.date,
          timestamp: activity.lastReadAt ?? activity.updatedAt,
        };
      })
      .filter((item): item is AccountPostItem => Boolean(item))
      .slice(0, 6);
  }
}

function PostCollection({ title, empty, posts, compact = false }: { title: string; empty: string; posts: AccountPostItem[]; compact?: boolean }) {
  if (compact && posts.length === 0) return null;

  return (
    <div className="space-y-3 border-2 border-[color:var(--line)] bg-[color:var(--surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-[color:var(--foreground)]">{title}</h3>
        <span className="mono-label text-xs font-black text-[color:var(--muted)]">{posts.length}</span>
      </div>
      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/articles/${post.slug}`}
              className="group flex min-h-11 items-center justify-between gap-3 rounded-[2px] border-2 border-[color:var(--line)] border-l-4 border-l-[color:var(--accent)] bg-[color:var(--paper)] px-3 py-2.5 transition-all duration-150 hover:-translate-y-[2px] hover:shadow-[3px_3px_0_var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
            >
              <span className="min-w-0">
                <span className="block text-sm font-black leading-6 text-[color:var(--foreground)]">{post.title}</span>
                <span className="mono-label mt-1 block text-xs font-bold text-[color:var(--muted)]">
                  {new Date(post.timestamp || post.date).toLocaleDateString("zh-CN")}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--accent-strong)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm font-bold leading-6 text-[color:var(--muted)]">{empty}</p>
      )}
    </div>
  );
}
