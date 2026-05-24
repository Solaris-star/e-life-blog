import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStoredUserByEmail, getStoredUserById, type MemberRole } from "./member-store";

export type SubscriptionStatus = "active" | "inactive" | "past_due";
export type MemberPlan = "free" | "basic" | "pro";

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  plan: MemberPlan;
  subscription: {
    status: SubscriptionStatus;
    renewsAt?: string;
  };
  role?: MemberRole;
}

const COOKIE_NAME = "blog_member_session";

export async function getCurrentUser(): Promise<MemberUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) return null;

  return getStoredUserById(session);
}

export async function requireAuth(): Promise<MemberUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireActiveSubscription(): Promise<MemberUser> {
  const user = await requireAuth();

  if (user.subscription.status !== "active") {
    redirect("/subscribe");
  }

  return user;
}

export async function requireAdmin(): Promise<MemberUser> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    redirect("/login?mode=admin");
  }

  return user;
}

export async function requireApiAuth(): Promise<MemberUser | Response> {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "请先登录。" }, { status: 401 });
  }

  return user;
}

export async function requireApiActiveSubscription(): Promise<MemberUser | Response> {
  const user = await requireApiAuth();
  if (user instanceof Response) return user;

  if (user.subscription.status !== "active") {
    return Response.json({ error: "当前订阅不可用。" }, { status: 403 });
  }

  return user;
}

export async function getDemoUserId(kind: "active" | "inactive" | "admin") {
  const email =
    kind === "admin"
      ? "admin@example.com"
      : kind === "inactive"
        ? "reader@example.com"
        : "member@example.com";
  const user = await getStoredUserByEmail(email);

  return user?.id ?? null;
}

export { COOKIE_NAME };
