"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAccess, type MemberPlan, type SubscriptionStatus } from "@/lib/member-auth";
import { getAdminActorEmail, kickMemberSessions, setMemberAccountStatus, setMemberSubscription } from "@/lib/member-service";
import { createRedeemCode } from "@/lib/member-redeem-codes";
import { assertSameOriginAction } from "@/lib/request-security";
import type { MemberAccountStatus } from "@/lib/member-store";

export async function updateAccountStatusAction(formData: FormData) {
  await assertSameOriginAction();
  await requireAdminAccess();
  const actorEmail = await getAdminActorEmail();
  const userId = String(formData.get("userId") || "");
  const accountStatus = String(formData.get("accountStatus") || "") as MemberAccountStatus;

  if (!userId || !["active", "disabled"].includes(accountStatus)) {
    return;
  }

  await setMemberAccountStatus({ userId, accountStatus, actorEmail });
  revalidateAdminPaths(userId);
}

export async function updateSubscriptionAction(formData: FormData) {
  await assertSameOriginAction();
  await requireAdminAccess();
  const actorEmail = await getAdminActorEmail();
  const userId = String(formData.get("userId") || "");
  const plan = String(formData.get("plan") || "free") as MemberPlan;
  const status = String(formData.get("status") || "inactive") as SubscriptionStatus;
  const renewsAt = String(formData.get("renewsAt") || "").trim();
  const allowedPlans: MemberPlan[] = ["free", "basic", "pro", "lifetime"];
  const allowedStatuses: SubscriptionStatus[] = ["inactive", "active", "past_due", "expired"];

  if (!userId || !allowedPlans.includes(plan) || !allowedStatuses.includes(status)) {
    return;
  }

  await setMemberSubscription({ userId, plan, status, renewsAt, actorEmail });
  revalidateAdminPaths(userId);
}

export async function kickSessionsAction(formData: FormData) {
  await assertSameOriginAction();
  await requireAdminAccess();
  const actorEmail = await getAdminActorEmail();
  const userId = String(formData.get("userId") || "");

  if (!userId) return;

  await kickMemberSessions({ userId, actorEmail });
  revalidateAdminPaths(userId);
}

export async function openUserDetailAction(formData: FormData) {
  await assertSameOriginAction();
  await requireAdminAccess();
  const userId = String(formData.get("userId") || "");
  if (!userId) return;
  redirect(`/admin/users/${userId}`);
}

export async function createRedeemCodeAction(formData: FormData) {
  await assertSameOriginAction();
  await requireAdminAccess();
  const actorEmail = await getAdminActorEmail();
  const plan = String(formData.get("plan") || "");
  const expiresAt = String(formData.get("expiresAt") || "").trim();
  const membershipExpiresAt = String(formData.get("membershipExpiresAt") || "").trim();
  const code = await createRedeemCode({ plan, expiresAt, membershipExpiresAt, createdBy: actorEmail });
  revalidatePath("/admin");
  if (code) redirect(`/admin?redeemCode=${encodeURIComponent(code.code)}`);
}

function revalidateAdminPaths(userId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/users/${userId}`);
}
