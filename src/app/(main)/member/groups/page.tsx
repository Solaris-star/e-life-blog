import { GroupJoinButton } from "@/components/member/GroupJoinButton";
import { logMemberAccess } from "@/lib/member-access-log";
import { requireActiveSubscription } from "@/lib/member-auth";
import { canAccessResource, memberGroups } from "@/lib/member-data";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function MemberGroupsPage() {
  const user = await requireActiveSubscription();
  await logMemberAccess({ action: "visit_member", userId: user.id, targetId: "/member/groups" });

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Member Groups</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          会员群组
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          页面不会显示永久邀请链接。点击后由服务端生成短时邀请码。
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {memberGroups.map((group) => {
          const canAccess = canAccessResource(user, group);

          return (
            <article key={group.id} className="mcm-card p-6 md:p-7">
              <span className="mcm-tag">required: {group.requiredPlan}</span>
              <h2 className="mt-4 text-2xl font-black text-[color:var(--foreground)]">
                {group.title}
              </h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">
                {group.summary}
              </p>
              <div className="mt-6">
                <GroupJoinButton groupId={group.id} disabled={!canAccess} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
