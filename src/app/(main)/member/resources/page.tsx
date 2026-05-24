import { ResourceDownloadButton } from "@/components/member/ResourceDownloadButton";
import { logMemberAccess } from "@/lib/member-access-log";
import { requireActiveSubscription } from "@/lib/member-auth";
import { canAccessResource, getVisibleResources } from "@/lib/member-data";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function MemberResourcesPage() {
  const user = await requireActiveSubscription();
  const resources = getVisibleResources(user);
  await logMemberAccess({ action: "visit_member", userId: user.id, targetId: "/member/resources" });

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Member Resources</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          会员资料库
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          这里仅展示资料元信息。下载时会再次经过服务端权限校验。
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {resources.map((resource) => {
          const canAccess = canAccessResource(user, resource);

          return (
            <article key={resource.id} className="mcm-card p-6 md:p-7">
              <div className="flex flex-wrap gap-2">
                <span className="mcm-tag">{resource.type}</span>
                <span className="mcm-tag">required: {resource.requiredPlan}</span>
              </div>
              <h2 className="mt-4 text-2xl font-black text-[color:var(--foreground)]">
                {resource.title}
              </h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[color:var(--walnut)]">
                {resource.summary}
              </p>
              <p className="mt-2 mono-label text-xs font-black text-[color:var(--walnut)]">
                updated: {resource.updatedAt}
              </p>
              <div className="mt-6">
                <ResourceDownloadButton resourceId={resource.id} disabled={!canAccess} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
