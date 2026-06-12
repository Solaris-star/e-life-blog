import "server-only";

export type MemberEmailKind = "verify" | "password_reset" | "email_change";
export type MemberEmailDeliveryResult = "sent" | "not_configured";

export function isMemberEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MEMBER_EMAIL_FROM);
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:5000").replace(/\/$/, "");
}

export function buildMemberUrl(path: string, token: string) {
  const url = new URL(path, siteUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendMemberEmail(input: {
  to: string;
  kind: MemberEmailKind;
  url: string;
}): Promise<MemberEmailDeliveryResult> {
  const subject = subjectForKind(input.kind);
  const text = `${subject}\n\n${input.url}\n\n如果不是你本人操作，可以忽略这封邮件。`;

  if (!isMemberEmailConfigured()) {
    console.warn(`[member-email] not_configured ${input.kind} ${input.to}`);
    return "not_configured";
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MEMBER_EMAIL_FROM,
      to: input.to,
      subject,
      text,
    }),
  });
  if (!response.ok) throw new Error(`Failed to send member email: ${response.status}`);
  return "sent";
}

function subjectForKind(kind: MemberEmailKind) {
  if (kind === "verify") return "确认你的博客会员邮箱";
  if (kind === "password_reset") return "重置你的博客会员密码";
  return "确认新的博客会员邮箱";
}
