import Link from "next/link";
import "./admin.css";
import { DaySelector } from "./DaySelector";
import { requireAdminAccess } from "@/lib/member-auth";
import { getAccessLogs, type AccessLogEntry } from "@/lib/member-access-log";
import { getPosts, type Post } from "@/lib/content";
import { getStoredAdminAuditLogs, getStoredSessions, getStoredUsers, type StoredMemberUser } from "@/lib/member-store";
import { getRedeemCodes } from "@/lib/member-redeem-codes";
import { createRedeemCodeAction, kickSessionsAction, updateAccountStatusAction, updateSubscriptionAction } from "./actions";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type AdminSearchParams = {
  redeemCode?: string;
  userQuery?: string;
  plan?: string;
  accountStatus?: string;
  subscriptionStatus?: string;
  analyticsDay?: string;
};

type PostViewSummary = {
  slug: string;
  title: string;
  access: string;
  total: number;
  today: number;
  uniqueUsers: number;
  latestAt?: string;
};

type DailyPostView = {
  day: string;
  slug: string;
  title: string;
  count: number;
  uniqueUsers: number;
};

function countByDay(logs: AccessLogEntry[]) {
  return logs.reduce<Record<string, number>>((acc, log) => {
    const day = log.createdAt.slice(0, 10);
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});
}

function userName(users: StoredMemberUser[], userId: string) {
  const user = users.find((item) => item.id === userId);
  return user ? `${user.name} / ${user.email}` : userId;
}

function getPostSlugFromTarget(targetId?: string) {
  return targetId?.split(":")[0] ?? "";
}

function buildPostAnalytics(logs: AccessLogEntry[], posts: Post[]) {
  const today = new Date().toISOString().slice(0, 10);
  const postMap = new Map(posts.map((post) => [post.slug, post]));
  const summary = new Map<string, PostViewSummary & { userIds: Set<string> }>();
  const daily = new Map<string, DailyPostView & { userIds: Set<string> }>();

  for (const log of logs) {
    if (log.action !== "view_post") continue;
    const slug = getPostSlugFromTarget(log.targetId);
    if (!slug) continue;
    const post = postMap.get(slug);
    const title = post?.meta.title ?? slug;
    const access = post?.meta.access ?? "unknown";
    const day = log.createdAt.slice(0, 10);

    const current = summary.get(slug) ?? {
      slug,
      title,
      access,
      total: 0,
      today: 0,
      uniqueUsers: 0,
      latestAt: undefined,
      userIds: new Set<string>(),
    };
    current.total += 1;
    current.today += day === today ? 1 : 0;
    current.latestAt = !current.latestAt || current.latestAt < log.createdAt ? log.createdAt : current.latestAt;
    current.userIds.add(log.userId);
    current.uniqueUsers = current.userIds.size;
    summary.set(slug, current);

    const dailyKey = `${day}:${slug}`;
    const currentDaily = daily.get(dailyKey) ?? {
      day,
      slug,
      title,
      count: 0,
      uniqueUsers: 0,
      userIds: new Set<string>(),
    };
    currentDaily.count += 1;
    currentDaily.userIds.add(log.userId);
    currentDaily.uniqueUsers = currentDaily.userIds.size;
    daily.set(dailyKey, currentDaily);
  }

  return {
    summaries: [...summary.values()]
      .map(stripUserIds)
      .sort((a, b) => b.total - a.total || (b.latestAt ?? "").localeCompare(a.latestAt ?? "")),
    dailyViews: [...daily.values()]
      .map(stripUserIds)
      .sort((a, b) => (a.day < b.day ? 1 : -1) || b.count - a.count),
  };
}

function stripUserIds<T extends { userIds: Set<string> }>(item: T) {
  const { userIds: _userIds, ...rest } = item;
  void _userIds;
  return rest;
}

function filterUsers(users: StoredMemberUser[], params: AdminSearchParams) {
  const query = params.userQuery?.trim().toLowerCase() ?? "";
  return users.filter((user) => {
    const matchesQuery = !query || [user.name, user.email, user.id].some((value) => value.toLowerCase().includes(query));
    const matchesPlan = !params.plan || params.plan === "all" || user.plan === params.plan;
    const matchesAccount = !params.accountStatus || params.accountStatus === "all" || user.accountStatus === params.accountStatus;
    const matchesSubscription = !params.subscriptionStatus || params.subscriptionStatus === "all" || user.subscription.status === params.subscriptionStatus;
    return matchesQuery && matchesPlan && matchesAccount && matchesSubscription;
  });
}

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString("zh-CN") : "—";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  await requireAdminAccess();
  const params = await searchParams;

  const [users, logs, sessions, auditLogs, redeemCodes, posts] = await Promise.all([
    getStoredUsers(),
    getAccessLogs(),
    getStoredSessions(),
    getStoredAdminAuditLogs(),
    getRedeemCodes(),
    getPosts(),
  ]);

  const downloads = logs.filter((log) => log.action === "download");
  const searches = logs.filter((log) => log.action === "search");
  const postViews = logs.filter((log) => log.action === "view_post");
  const subscribedUsers = users.filter((user) => user.subscription.status === "active" || user.plan === "lifetime");
  const disabledUsers = users.filter((user) => user.accountStatus === "disabled");
  const groupedDays = Object.entries(countByDay(logs)).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const filteredUsers = filterUsers(users, params);
  const activeRedeemCodes = redeemCodes.filter((code) => code.status === "unused");
  const { summaries: postSummaries, dailyViews } = buildPostAnalytics(logs, posts);
  const analyticsDays = [...new Set(dailyViews.map((item) => item.day))];
  const selectedDay = params.analyticsDay && analyticsDays.includes(params.analyticsDay)
    ? params.analyticsDay
    : analyticsDays[0] ?? "";
  const selectedDayViews = selectedDay ? dailyViews.filter((item) => item.day === selectedDay) : [];
  const topPosts = postSummaries.slice(0, 8);

  return (
    <div className="admin-shell pb-10">
      <header className="admin-hero">
        <div className="space-y-4">
          <p className="admin-kicker">Admin Console</p>
          <h1>博客管理后台</h1>
          <p>集中查看会员、订阅、兑换码、阅读行为和后台操作。当前数据来自会员系统日志。</p>
        </div>
        <nav className="admin-nav" aria-label="后台分区">
          <a href="#overview">总览</a>
          <a href="#analytics">阅读量</a>
          <a href="#users">用户</a>
          <a href="#redeem">兑换码</a>
          <a href="#logs">日志</a>
        </nav>
      </header>

      <section id="overview" className="admin-grid admin-grid-five">
        <StatCard title="注册用户" value={users.length} detail={`${subscribedUsers.length} 个有效订阅`} tone="violet" />
        <StatCard title="会员阅读" value={postViews.length} detail={`${postSummaries.length} 篇有记录`} tone="green" />
        <StatCard title="活跃会话" value={sessions.length} detail="当前未过期会话" tone="blue" />
        <StatCard title="可用兑换码" value={activeRedeemCodes.length} detail={`共 ${redeemCodes.length} 个`} tone="orange" />
        <StatCard title="搜索 / 下载" value={`${searches.length} / ${downloads.length}`} detail={`${disabledUsers.length} 个禁用用户`} tone="gray" />
      </section>

      <section id="analytics" className="admin-section">
        <SectionHeader eyebrow="Analytics" title="文章阅读量" description="统计会员实际打开受保护文章的记录。公开文章全站 PV 需要接 Umami 或独立访问日志。" />
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <h3>热门文章</h3>
                <p>按累计会员阅读次数排序</p>
              </div>
              <span className="admin-pill">{postViews.length} 次</span>
            </div>
            <div className="admin-list">
              {topPosts.map((post, index) => (
                <Link key={post.slug} href={`/articles/${post.slug}`} className="admin-rank-row">
                  <span className="admin-rank">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <strong>{post.title}</strong>
                    <small>{post.slug} · {post.access} · 最近 {formatDateTime(post.latestAt)}</small>
                  </span>
                  <span className="admin-metric"><b>{post.total}</b><small>今日 {post.today} · {post.uniqueUsers} 人</small></span>
                </Link>
              ))}
              {topPosts.length === 0 && <EmptyState text="还没有会员阅读记录。" />}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <h3>每日每篇</h3>
                <p>按日期查看每篇文章阅读量</p>
              </div>
              <DaySelector days={analyticsDays} selectedDay={selectedDay} />
            </div>
            <div className="admin-list compact">
              {selectedDayViews.map((item) => (
                <div key={`${item.day}-${item.slug}`} className="admin-data-row">
                  <span className="min-w-0">
                    <strong>{item.title}</strong>
                    <small>{item.slug}</small>
                  </span>
                  <span className="admin-metric"><b>{item.count}</b><small>{item.uniqueUsers} 人</small></span>
                </div>
              ))}
              {selectedDayViews.length === 0 && <EmptyState text="这天没有会员阅读记录。" />}
            </div>
          </div>
        </div>
      </section>

      <section id="users" className="admin-section">
        <SectionHeader eyebrow="Users" title="用户管理" description="支持按关键词、套餐、账号状态和订阅状态筛选。" />
        <div className="admin-panel overflow-hidden p-0">
          <form method="GET" action="/admin#users" className="admin-toolbar">
            <input className="admin-input min-w-[220px] flex-1" name="userQuery" defaultValue={params.userQuery ?? ""} placeholder="搜索用户名 / 邮箱 / ID" />
            <select className="admin-input" name="plan" defaultValue={params.plan ?? "all"} aria-label="套餐">
              <option value="all">全部套餐</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="lifetime">Lifetime</option>
            </select>
            <select className="admin-input" name="accountStatus" defaultValue={params.accountStatus ?? "all"} aria-label="账号状态">
              <option value="all">全部账号</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <select className="admin-input" name="subscriptionStatus" defaultValue={params.subscriptionStatus ?? "all"} aria-label="订阅状态">
              <option value="all">全部订阅</option>
              <option value="inactive">Inactive</option>
              <option value="active">Active</option>
              <option value="past_due">Past due</option>
              <option value="expired">Expired</option>
            </select>
            <button type="submit" className="admin-button primary">筛选</button>
            <Link href="/admin#users" className="admin-button">重置</Link>
          </form>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>账号</th>
                  <th>订阅</th>
                  <th>活跃</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <UserRow key={user.id} user={user} sessionCount={sessions.filter((session) => session.userId === user.id).length} />
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5}><EmptyState text="没有匹配用户。" /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="redeem" className="admin-section">
        <SectionHeader eyebrow="Redeem Codes" title="兑换码" description="生成会员兑换码，并追踪使用状态。" />
        <div className="admin-panel space-y-5">
          {params.redeemCode && (
            <div className="admin-new-code">
              <span>新兑换码</span>
              <code>{params.redeemCode}</code>
            </div>
          )}
          <form action={createRedeemCodeAction} className="grid gap-3 lg:grid-cols-[180px_1fr_1fr_auto]">
            <select name="plan" defaultValue="basic" className="admin-input">
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="lifetime">Lifetime</option>
            </select>
            <input name="expiresAt" type="date" aria-label="兑换码有效期" className="admin-input" />
            <input name="membershipExpiresAt" type="date" aria-label="会员有效期" className="admin-input" />
            <button type="submit" className="admin-button primary">生成兑换码</button>
          </form>
          <div className="grid gap-3 lg:grid-cols-2">
            {redeemCodes.slice(0, 10).map((code) => (
              <div key={code.id} className="admin-code-card">
                <div className="flex flex-wrap gap-2">
                  <span className="admin-pill accent">{code.plan}</span>
                  <span className="admin-pill">{code.status}</span>
                  {code.expiresAt && <span className="admin-pill">码到期 {code.expiresAt.slice(0, 10)}</span>}
                  {code.membershipExpiresAt && <span className="admin-pill">会员到期 {code.membershipExpiresAt.slice(0, 10)}</span>}
                </div>
                <code>{code.code}</code>
                {code.usedBy && <p>已使用：{userName(users, code.usedBy)}</p>}
              </div>
            ))}
            {redeemCodes.length === 0 && <EmptyState text="还没有兑换码。" action={{ label: "生成第一个", href: "#redeem" }} />}
          </div>
        </div>
      </section>

      <section id="logs" className="admin-section grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="admin-panel">
          <SectionHeader eyebrow="Daily Frequency" title="每日访问" description="会员系统访问日志汇总。" compact />
          <div className="admin-list compact">
            {groupedDays.slice(0, 12).map(([day, count]) => (
              <div key={day} className="admin-data-row">
                <strong>{day}</strong>
                <span className="admin-pill">{count} 次</span>
              </div>
            ))}
            {groupedDays.length === 0 && <EmptyState text="暂无访问记录。" />}
          </div>
        </div>
        <div className="admin-panel">
          <SectionHeader eyebrow="Recent Activity" title="后台与访问记录" description="最近操作和会员访问。" compact />
          <div className="grid gap-4 lg:grid-cols-2">
            <ActivityList title="后台操作" items={auditLogs.slice(-8).reverse().map((log) => ({
              key: log.id,
              badges: [log.action, log.actorEmail],
              title: userName(users, log.targetUserId),
              time: log.createdAt,
            }))} />
            <ActivityList title="会员访问" items={logs.slice(-8).reverse().map((log) => ({
              key: `${log.createdAt}-${log.userId}-${log.action}`,
              badges: [log.action, log.targetId].filter(Boolean) as string[],
              title: userName(users, log.userId),
              time: log.createdAt,
            }))} />
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, compact = false }: { eyebrow: string; title: string; description: string; compact?: boolean }) {
  return (
    <div className={compact ? "admin-section-head compact" : "admin-section-head"}>
      <p className="admin-kicker">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function UserRow({ user, sessionCount }: { user: StoredMemberUser; sessionCount: number }) {
  const isDisabled = user.accountStatus === "disabled";

  return (
    <tr>
      <td>
        <Link href={`/admin/users/${encodeURIComponent(user.id)}`} className="admin-user-link">{user.name}</Link>
        <p>{user.email}</p>
        <small>{user.id}</small>
      </td>
      <td>
        <div className="flex flex-wrap gap-2">
          <span className={isDisabled ? "admin-pill danger" : "admin-pill success"}>{user.accountStatus}</span>
          <span className="admin-pill">{sessionCount} 会话</span>
          {user.emailVerified && <span className="admin-pill success">已验邮箱</span>}
        </div>
      </td>
      <td>
        <div className="flex flex-wrap gap-2">
          <span className="admin-pill accent">{user.plan}</span>
          <span className="admin-pill">{user.subscription.status}</span>
        </div>
        {user.subscription.renewsAt && <small>到期：{user.subscription.renewsAt.slice(0, 10)}</small>}
      </td>
      <td>
        <strong>{formatDateTime(user.lastLoginAt)}</strong>
        <small>注册 {user.createdAt.slice(0, 10)}</small>
      </td>
      <td>
        <div className="flex flex-wrap gap-2">
          <form action={updateAccountStatusAction}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="accountStatus" value={isDisabled ? "active" : "disabled"} />
            <button type="submit" className="admin-button small">{isDisabled ? "启用" : "禁用"}</button>
          </form>
          <form action={kickSessionsAction}>
            <input type="hidden" name="userId" value={user.id} />
            <button type="submit" className="admin-button small">踢下线</button>
          </form>
          <form action={updateSubscriptionAction}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="plan" value="pro" />
            <input type="hidden" name="status" value="active" />
            <button type="submit" className="admin-button primary small">开 Pro</button>
          </form>
          <Link href={`/admin/users/${encodeURIComponent(user.id)}`} className="admin-button small">详情</Link>
        </div>
      </td>
    </tr>
  );
}

function StatCard({ title, value, detail, tone }: { title: string; value: number | string; detail: string; tone: "violet" | "green" | "blue" | "orange" | "gray" }) {
  return (
    <div className={`admin-stat ${tone}`}>
      <p>{title}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

function ActivityList({ title, items }: { title: string; items: Array<{ key: string; badges: string[]; title: string; time: string }> }) {
  return (
    <div className="admin-activity-list">
      <h3>{title}</h3>
      {items.map((item) => (
        <div key={item.key} className="admin-activity-item">
          <div className="flex flex-wrap gap-2">{item.badges.map((badge) => <span key={badge} className="admin-pill">{badge}</span>)}</div>
          <strong>{item.title}</strong>
          <small>{formatDateTime(item.time)}</small>
        </div>
      ))}
      {items.length === 0 && <EmptyState text="暂无记录。" />}
    </div>
  );
}

function EmptyState({ text, action }: { text: string; action?: { label: string; href: string } }) {
  return (
    <div className="admin-empty-wrapper">
      <p className="admin-empty">{text}</p>
      {action && (
        <Link href={action.href} className="admin-button primary small">
          {action.label}
        </Link>
      )}
    </div>
  );
}
