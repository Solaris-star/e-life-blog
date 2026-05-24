import { requireAdmin } from "@/lib/member-auth";
import { getAccessLogs } from "@/lib/member-access-log";
import { getStoredUsers } from "@/lib/member-store";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function countByDay(logs: Awaited<ReturnType<typeof getAccessLogs>>) {
  return logs.reduce<Record<string, number>>((acc, log) => {
    const day = log.createdAt.slice(0, 10);
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});
}

function userName(users: Awaited<ReturnType<typeof getStoredUsers>>, userId: string) {
  const user = users.find((item) => item.id === userId);
  return user ? `${user.name} / ${user.email}` : userId;
}

export default async function AdminPage() {
  await requireAdmin();

  const [users, logs] = await Promise.all([getStoredUsers(), getAccessLogs()]);
  const downloads = logs.filter((log) => log.action === "download");
  const searches = logs.filter((log) => log.action === "search");
  const groupedDays = Object.entries(countByDay(logs)).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Admin</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          管理后台
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          这里能看到注册用户、订阅状态、访问记录、下载记录和每天访问次数。当前是本地文件版，后续可以换成数据库。
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-4">
        <StatCard title="注册用户" value={users.length} />
        <StatCard title="访问记录" value={logs.length} />
        <StatCard title="下载次数" value={downloads.length} />
        <StatCard title="搜索次数" value={searches.length} />
      </section>

      <section className="mcm-card overflow-hidden p-0">
        <div className="border-b-2 border-[color:var(--line)] p-5">
          <p className="section-kicker">Users</p>
          <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">注册用户</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm font-bold">
            <thead className="bg-[color:var(--surface-muted)]">
              <tr>
                <th className="border-b-2 border-[color:var(--line)] p-4">用户</th>
                <th className="border-b-2 border-[color:var(--line)] p-4">邮箱</th>
                <th className="border-b-2 border-[color:var(--line)] p-4">角色</th>
                <th className="border-b-2 border-[color:var(--line)] p-4">方案</th>
                <th className="border-b-2 border-[color:var(--line)] p-4">订阅</th>
                <th className="border-b-2 border-[color:var(--line)] p-4">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border-b border-[color:var(--line)] p-4">{user.name}</td>
                  <td className="border-b border-[color:var(--line)] p-4">{user.email}</td>
                  <td className="border-b border-[color:var(--line)] p-4">{user.role}</td>
                  <td className="border-b border-[color:var(--line)] p-4">{user.plan}</td>
                  <td className="border-b border-[color:var(--line)] p-4">{user.subscription.status}</td>
                  <td className="border-b border-[color:var(--line)] p-4">{new Date(user.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="mcm-card p-5">
          <p className="section-kicker">Daily Frequency</p>
          <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">
            每天访问次数
          </h2>
          <div className="mt-5 space-y-3">
            {groupedDays.map(([day, count]) => (
              <div key={day} className="flex items-center justify-between border-b border-dashed border-[color:var(--line)] pb-2 text-sm font-bold">
                <span>{day}</span>
                <span className="mcm-tag">{count} 次</span>
              </div>
            ))}
            {groupedDays.length === 0 && <p className="text-sm font-bold text-[color:var(--walnut)]">暂无访问记录。</p>}
          </div>
        </div>

        <div className="mcm-card p-5">
          <p className="section-kicker">Access Logs</p>
          <h2 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">
            最近访问记录
          </h2>
          <div className="mt-5 space-y-3">
            {logs.slice(-12).reverse().map((log) => (
              <div key={`${log.createdAt}-${log.userId}-${log.action}`} className="border-b border-dashed border-[color:var(--line)] pb-3">
                <div className="flex flex-wrap gap-2">
                  <span className="mcm-tag">{log.action}</span>
                  {log.targetId && <span className="mcm-tag">{log.targetId}</span>}
                </div>
                <p className="mt-2 text-sm font-bold text-[color:var(--foreground)]">
                  {userName(users, log.userId)}
                </p>
                <p className="mt-1 mono-label text-xs font-black text-[color:var(--walnut)]">
                  {new Date(log.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm font-bold text-[color:var(--walnut)]">暂无访问记录。</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="mcm-card p-5">
      <p className="section-kicker">{title}</p>
      <p className="mt-4 text-4xl font-black text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
