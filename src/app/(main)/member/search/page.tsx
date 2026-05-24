import { MemberSearchClient } from "@/components/member/MemberSearchClient";
import { logMemberAccess } from "@/lib/member-access-log";
import { requireActiveSubscription } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function MemberSearchPage() {
  const user = await requireActiveSubscription();
  await logMemberAccess({ action: "visit_member", userId: user.id, targetId: "/member/search" });

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Member Search</p>
        <h1 className="text-4xl font-black text-[color:var(--foreground)] md:text-6xl">
          会员搜索
        </h1>
        <p className="max-w-2xl font-bold leading-8 text-[color:var(--walnut)]">
          搜索请求会提交到 /api/member/search，浏览器不会拿到完整会员索引。
        </p>
      </header>

      <MemberSearchClient />
    </div>
  );
}
