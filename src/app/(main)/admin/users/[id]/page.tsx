import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireAdminAccess } from "@/lib/member-auth";
import { getAccessLogs } from "@/lib/member-access-log";
import { getActiveSessionsForUser } from "@/lib/member-service";
import { getStoredAdminAuditLogs, getStoredUserById } from "@/lib/member-store";
import { kickSessionsAction, updateAccountStatusAction, updateSubscriptionAction } from "../../actions";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess();
  const { id } = await params;
  const [user, sessions, accessLogs, auditLogs] = await Promise.all([
    getStoredUserById(id),
    getActiveSessionsForUser(id),
    getAccessLogs(),
    getStoredAdminAuditLogs(),
  ]);

  if (!user) notFound();

  const userAccessLogs = accessLogs.filter((log) => log.userId === user.id).slice(-20).reverse();
  const userAuditLogs = auditLogs.filter((log) => log.targetUserId === user.id).slice(-20).reverse();
  const isDisabled = user.accountStatus === "disabled";

  return (
    <div className="space-y-8 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <Link href="/admin" className="text-sm font-black text-[color:var(--accent-strong)]">← 返回后台</Link>
        <p className="section-kicker">User Detail</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          {user.name}
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          {user.email}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="mcm-tag">account: {user.accountStatus}</span>
          <span className="mcm-tag">plan: {user.plan}</span>
          <span className="mcm-tag">subscription: {user.subscription.status}</span>
          <span className="mcm-tag">sessions: {sessions.length}</span>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="mcm-card space-y-5 p-6">
          <div>
            <p className="section-kicker">Account</p>
            <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">账户操作</h2>
          </div>
          <form action={updateAccountStatusAction} className="flex flex-wrap gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="accountStatus" value={isDisabled ? "active" : "disabled"} />
            <button type="submit" className="mcm-button mcm-button-secondary">
              {isDisabled ? "启用用户" : "禁用用户"}
            </button>
          </form>
          <form action={kickSessionsAction}>
            <input type="hidden" name="userId" value={user.id} />
            <button type="submit" className="mcm-button mcm-button-secondary">踢掉所有登录会话</button>
          </form>
          <div className="space-y-2 text-sm font-bold text-[color:var(--walnut)]">
            <p>注册：{new Date(user.createdAt).toLocaleString("zh-CN")}</p>
            <p>更新：{new Date(user.updatedAt).toLocaleString("zh-CN")}</p>
            <p>最后登录：{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("zh-CN") : "未登录"}</p>
          </div>
        </div>

        <form action={updateSubscriptionAction} className="mcm-card space-y-5 p-6">
          <input type="hidden" name="userId" value={user.id} />
          <div>
            <p className="section-kicker">Subscription</p>
            <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">订阅管理</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-black text-[color:var(--foreground)]">
              套餐
              <select name="plan" defaultValue={user.plan} className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-3 font-bold">
                <option value="free">free</option>
                <option value="basic">basic</option>
                <option value="pro">pro</option>
                <option value="lifetime">lifetime</option>
              </select>
            </label>
            <label className="text-sm font-black text-[color:var(--foreground)]">
              状态
              <select name="status" defaultValue={user.subscription.status} className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-3 font-bold">
                <option value="inactive">inactive</option>
                <option value="active">active</option>
                <option value="past_due">past_due</option>
                <option value="expired">expired</option>
              </select>
            </label>
            <label className="text-sm font-black text-[color:var(--foreground)]">
              到期时间
              <input name="renewsAt" defaultValue={user.subscription.renewsAt ?? ""} placeholder="2026-12-31" className="mt-2 min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-3 font-bold" />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="mcm-button mcm-button-primary">保存订阅</button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <LogPanel title="登录会话" empty="暂无活跃会话。">
          {sessions.map((session) => (
            <div key={session.id} className="border-b border-dashed border-[color:var(--line)] pb-3 text-sm font-bold">
              <p className="mono-label text-xs text-[color:var(--foreground)]">{session.id}</p>
              <p className="mt-2 text-[color:var(--walnut)]">创建：{new Date(session.createdAt).toLocaleString("zh-CN")}</p>
              <p className="text-[color:var(--walnut)]">过期：{new Date(session.expiresAt).toLocaleString("zh-CN")}</p>
            </div>
          ))}
        </LogPanel>
        <LogPanel title="访问记录" empty="暂无访问记录。">
          {userAccessLogs.map((log) => (
            <div key={`${log.createdAt}-${log.action}-${log.targetId ?? ""}`} className="border-b border-dashed border-[color:var(--line)] pb-3 text-sm font-bold">
              <div className="flex flex-wrap gap-2"><span className="mcm-tag">{log.action}</span>{log.targetId && <span className="mcm-tag">{log.targetId}</span>}</div>
              <p className="mt-2 text-[color:var(--walnut)]">{new Date(log.createdAt).toLocaleString("zh-CN")}</p>
            </div>
          ))}
        </LogPanel>
        <LogPanel title="后台审计" empty="暂无后台操作。">
          {userAuditLogs.map((log) => (
            <div key={log.id} className="border-b border-dashed border-[color:var(--line)] pb-3 text-sm font-bold">
              <div className="flex flex-wrap gap-2"><span className="mcm-tag">{log.action}</span><span className="mcm-tag">{log.actorEmail}</span></div>
              <p className="mt-2 text-[color:var(--walnut)]">{new Date(log.createdAt).toLocaleString("zh-CN")}</p>
            </div>
          ))}
        </LogPanel>
      </section>
    </div>
  );
}

function LogPanel({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="mcm-card p-5">
      <p className="section-kicker">{title}</p>
      <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">{title}</h2>
      <div className="mt-5 space-y-3">
        {hasChildren ? children : <p className="text-sm font-bold text-[color:var(--walnut)]">{empty}</p>}
      </div>
    </div>
  );
}
