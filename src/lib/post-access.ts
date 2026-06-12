import type { PostAccessLevel } from "./content";
import { hasActiveSubscription, type MemberPlan, type MemberUser } from "./member-auth";

const ACCESS_RANK: Record<PostAccessLevel, number> = {
  public: 0,
  free: 1,
  basic: 2,
  pro: 3,
  lifetime: 4,
};

const PLAN_RANK: Record<MemberPlan, number> = {
  free: 1,
  basic: 2,
  pro: 3,
  lifetime: 4,
};

export function canReadPost(user: MemberUser | null, access: PostAccessLevel = "public") {
  if (access === "public") return true;
  if (!user || user.accountStatus === "disabled" || !user.emailVerified) return false;
  if (access === "free") return true;
  if (!hasActiveSubscription(user)) return false;
  return PLAN_RANK[user.plan] >= ACCESS_RANK[access];
}

export function getPostAccessLabel(access: PostAccessLevel = "public") {
  const labels: Record<PostAccessLevel, string> = {
    public: "公开",
    free: "登录会员",
    basic: "Basic 会员",
    pro: "Pro 会员",
    lifetime: "终身会员",
  };
  return labels[access];
}
