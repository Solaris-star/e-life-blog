import { requireActiveSubscription } from "@/lib/member-auth";
import { logMemberAccess } from "@/lib/member-access-log";
import MemberSearchClientPage from "./MemberSearchClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function MemberSearchPage() {
  const user = await requireActiveSubscription();
  await logMemberAccess({ action: "search", userId: user.id, targetId: "/member/search" });

  return <MemberSearchClientPage />;
}
