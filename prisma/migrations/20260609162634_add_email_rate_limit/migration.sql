-- CreateTable
CREATE TABLE "MemberUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" DATETIME,
    "passwordHash" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "role" TEXT NOT NULL DEFAULT 'member',
    "accountStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive',
    "subscriptionRenewsAt" DATETIME,
    "lastLoginAt" DATETIME,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorEnabledAt" DATETIME,
    "twoFactorSetupExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MemberSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "MemberSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemberAccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MemberAdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MemberRegistrationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailHash" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberRegistrationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemberLoginEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailHash" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberLoginEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemberHumanChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "answerHash" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME
);

-- CreateTable
CREATE TABLE "MemberPostActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastReadAt" DATETIME,
    "readCount" INTEGER,
    CONSTRAINT "MemberPostActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemberRedeemCode" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "membershipExpiresAt" DATETIME,
    "usedBy" TEXT,
    "usedAt" DATETIME,
    CONSTRAINT "MemberRedeemCode_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "MemberUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemberAccountToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT,
    "tokenHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    CONSTRAINT "MemberAccountToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemberEmailRateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberUser_email_key" ON "MemberUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MemberUser_normalizedEmail_key" ON "MemberUser"("normalizedEmail");

-- CreateIndex
CREATE INDEX "MemberUser_createdAt_idx" ON "MemberUser"("createdAt");

-- CreateIndex
CREATE INDEX "MemberUser_plan_subscriptionStatus_idx" ON "MemberUser"("plan", "subscriptionStatus");

-- CreateIndex
CREATE INDEX "MemberSession_userId_idx" ON "MemberSession"("userId");

-- CreateIndex
CREATE INDEX "MemberSession_expiresAt_idx" ON "MemberSession"("expiresAt");

-- CreateIndex
CREATE INDEX "MemberAccessLog_createdAt_idx" ON "MemberAccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "MemberAccessLog_userId_idx" ON "MemberAccessLog"("userId");

-- CreateIndex
CREATE INDEX "MemberAccessLog_action_idx" ON "MemberAccessLog"("action");

-- CreateIndex
CREATE INDEX "MemberAdminAuditLog_createdAt_idx" ON "MemberAdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "MemberAdminAuditLog_targetUserId_idx" ON "MemberAdminAuditLog"("targetUserId");

-- CreateIndex
CREATE INDEX "MemberRegistrationEvent_createdAt_idx" ON "MemberRegistrationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "MemberRegistrationEvent_emailHash_idx" ON "MemberRegistrationEvent"("emailHash");

-- CreateIndex
CREATE INDEX "MemberRegistrationEvent_ip_idx" ON "MemberRegistrationEvent"("ip");

-- CreateIndex
CREATE INDEX "MemberRegistrationEvent_fingerprint_idx" ON "MemberRegistrationEvent"("fingerprint");

-- CreateIndex
CREATE INDEX "MemberLoginEvent_createdAt_idx" ON "MemberLoginEvent"("createdAt");

-- CreateIndex
CREATE INDEX "MemberLoginEvent_emailHash_idx" ON "MemberLoginEvent"("emailHash");

-- CreateIndex
CREATE INDEX "MemberLoginEvent_ip_idx" ON "MemberLoginEvent"("ip");

-- CreateIndex
CREATE INDEX "MemberLoginEvent_fingerprint_idx" ON "MemberLoginEvent"("fingerprint");

-- CreateIndex
CREATE INDEX "MemberHumanChallenge_expiresAt_idx" ON "MemberHumanChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "MemberHumanChallenge_ip_fingerprint_purpose_idx" ON "MemberHumanChallenge"("ip", "fingerprint", "purpose");

-- CreateIndex
CREATE INDEX "MemberPostActivity_slug_idx" ON "MemberPostActivity"("slug");

-- CreateIndex
CREATE INDEX "MemberPostActivity_updatedAt_idx" ON "MemberPostActivity"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MemberPostActivity_userId_slug_type_key" ON "MemberPostActivity"("userId", "slug", "type");

-- CreateIndex
CREATE INDEX "MemberRedeemCode_status_idx" ON "MemberRedeemCode"("status");

-- CreateIndex
CREATE INDEX "MemberRedeemCode_usedBy_idx" ON "MemberRedeemCode"("usedBy");

-- CreateIndex
CREATE UNIQUE INDEX "MemberAccountToken_tokenHash_key" ON "MemberAccountToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MemberAccountToken_userId_type_idx" ON "MemberAccountToken"("userId", "type");

-- CreateIndex
CREATE INDEX "MemberAccountToken_email_type_idx" ON "MemberAccountToken"("email", "type");

-- CreateIndex
CREATE INDEX "MemberAccountToken_expiresAt_idx" ON "MemberAccountToken"("expiresAt");

-- CreateIndex
CREATE INDEX "MemberEmailRateLimit_email_purpose_sentAt_idx" ON "MemberEmailRateLimit"("email", "purpose", "sentAt");
