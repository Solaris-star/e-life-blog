import "server-only";

import { prisma } from "./prisma";

interface EmailRateLimit {
  id: string;
  email: string;
  purpose: "verify" | "password_reset" | "email_change";
  sentAt: Date;
  createdAt: Date;
}

const rateLimits = {
  verify: { window: 60 * 60 * 1000, maxAttempts: 3 }, // 1 hour, 3 次
  password_reset: { window: 60 * 60 * 1000, maxAttempts: 3 }, // 1 hour, 3 次
  email_change: { window: 60 * 60 * 1000, maxAttempts: 3 }, // 1 hour, 3 次
};

/**
 * 检查邮件发送是否超过速率限制
 */
export async function checkEmailRateLimit(
  email: string,
  purpose: "verify" | "password_reset" | "email_change"
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const limit = rateLimits[purpose];
  const now = new Date();
  const windowStart = new Date(now.getTime() - limit.window);

  // 查询时间窗口内的发送记录
  const recentSends = await prisma.$queryRaw<EmailRateLimit[]>`
    SELECT * FROM MemberEmailRateLimit
    WHERE email = ${email.toLowerCase()}
      AND purpose = ${purpose}
      AND sentAt >= ${windowStart.toISOString()}
    ORDER BY sentAt DESC
  `;

  if (recentSends.length >= limit.maxAttempts) {
    const oldestSend = recentSends[recentSends.length - 1];
    const retryAfter = Math.ceil((oldestSend.sentAt.getTime() + limit.window - now.getTime()) / 1000);
    return { allowed: false, retryAfter: Math.max(retryAfter, 0) };
  }

  return { allowed: true };
}

/**
 * 记录邮件发送
 */
export async function recordEmailSent(
  email: string,
  purpose: "verify" | "password_reset" | "email_change"
): Promise<void> {
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO MemberEmailRateLimit (id, email, purpose, sentAt, createdAt)
    VALUES (
      ${"email_" + Date.now() + "_" + Math.random().toString(36).slice(2)},
      ${email.toLowerCase()},
      ${purpose},
      ${now.toISOString()},
      ${now.toISOString()}
    )
  `;
}

/**
 * 清理过期记录（可定期调用）
 */
export async function cleanupExpiredEmailRateLimits(): Promise<number> {
  const maxWindow = Math.max(...Object.values(rateLimits).map((l) => l.window));
  const cutoff = new Date(Date.now() - maxWindow);

  const result = await prisma.$executeRaw`
    DELETE FROM MemberEmailRateLimit
    WHERE sentAt < ${cutoff.toISOString()}
  `;

  return result;
}
