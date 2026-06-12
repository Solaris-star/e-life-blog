import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/member-auth";
import { createTwoFactorSecret, getTwoFactorOtpAuthUri, verifyTotpToken } from "@/lib/member-2fa";
import { updateStoredUser } from "@/lib/member-store";
import { redeemMembershipCode } from "@/lib/member-redeem-codes";
import { changeMemberPassword, requestMemberEmailChange, sendEmailVerification } from "@/lib/member-service";

const twoFactorSetupTtlMs = 10 * 60 * 1000;

function isTwoFactorSetupExpired(expiresAt?: string) {
  if (!expiresAt) return true;
  const timestamp = Date.parse(expiresAt);
  return Number.isNaN(timestamp) || timestamp <= Date.now();
}

export async function startTwoFactorSetup() {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const secret = createTwoFactorSecret();
  const setupExpiresAt = new Date(Date.now() + twoFactorSetupTtlMs).toISOString();
  await updateStoredUser(user.id, {
    twoFactor: {
      enabled: false,
      secret,
      setupExpiresAt,
    },
  });
  redirect("/account?twoFactor=setup#two-factor");
}

export async function confirmTwoFactorSetup(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const token = String(formData.get("token") || "");
  const secret = user.twoFactor?.secret;
  if (!secret || isTwoFactorSetupExpired(user.twoFactor?.setupExpiresAt)) {
    await updateStoredUser(user.id, { twoFactor: { enabled: false } });
    redirect("/account?twoFactor=expired#two-factor");
  }
  if (!verifyTotpToken({ secret, token })) {
    redirect("/account?twoFactor=invalid#two-factor");
  }

  await updateStoredUser(user.id, {
    twoFactor: {
      enabled: true,
      secret,
      enabledAt: new Date().toISOString(),
    },
  });
  redirect("/account?twoFactor=enabled#two-factor");
}

export async function disableTwoFactor(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const token = String(formData.get("token") || "");
  const secret = user.twoFactor?.secret;
  if (!secret || !user.twoFactor?.enabled || !verifyTotpToken({ secret, token })) {
    redirect("/account?twoFactor=disable_invalid#two-factor");
  }

  await updateStoredUser(user.id, { twoFactor: { enabled: false } });
  redirect("/account?twoFactor=disabled#two-factor");
}

export async function redeemCodeAction(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const code = String(formData.get("code") || "");
  const result = await redeemMembershipCode({ userId: user.id, code });
  if (!result.ok) {
    redirect(`/account?redeem=${result.error}`);
  }
  redirect(`/account?redeem=success&plan=${encodeURIComponent(result.code.plan)}`);
}

export async function resendVerificationEmailAction() {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const result = await sendEmailVerification(user.id);
  redirect(`/account?email=${result === "sent" ? "sent" : "mail_not_configured"}#account-security`);
}

export async function changePasswordAction(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const result = await changeMemberPassword({
    userId: user.id,
    currentPassword: String(formData.get("currentPassword") || ""),
    password: String(formData.get("password") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  });
  redirect(`/account?password=${result.ok ? "changed" : result.error}#account-security`);
}

export async function requestEmailChangeAction(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const result = await requestMemberEmailChange({
    userId: user.id,
    newEmail: String(formData.get("newEmail") || ""),
    currentPassword: String(formData.get("currentPassword") || ""),
  });
  redirect(`/account?email=${result.ok ? "change_sent" : result.error}#account-security`);
}

export function getTwoFactorSetupUri(email: string, secret: string) {
  return getTwoFactorOtpAuthUri({ email, secret });
}
