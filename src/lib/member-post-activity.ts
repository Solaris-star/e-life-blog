import "server-only";

import { randomBytes } from "crypto";
import { prisma } from "./prisma";

export type MemberPostActivityType = "bookmark" | "read_later" | "history";

export interface StoredMemberPostActivity {
  id: string;
  userId: string;
  slug: string;
  type: MemberPostActivityType;
  createdAt: string;
  updatedAt: string;
  lastReadAt?: string;
  readCount?: number;
}

type DbPostActivity = Awaited<ReturnType<typeof prisma.memberPostActivity.findFirst>> extends infer T ? NonNullable<T> : never;

function toStoredActivity(activity: DbPostActivity): StoredMemberPostActivity {
  return {
    id: activity.id,
    userId: activity.userId,
    slug: activity.slug,
    type: activity.type as MemberPostActivityType,
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
    lastReadAt: activity.lastReadAt?.toISOString(),
    readCount: activity.readCount ?? undefined,
  };
}

export async function getMemberPostActivities(userId: string): Promise<StoredMemberPostActivity[]> {
  const activities = await prisma.memberPostActivity.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return activities.map(toStoredActivity);
}

export async function getMemberPostActivityState(userId: string, slug: string) {
  const activities = await prisma.memberPostActivity.findMany({
    where: { userId, slug, type: { in: ["bookmark", "read_later"] } },
  });
  return {
    bookmarked: activities.some((activity) => activity.type === "bookmark"),
    readLater: activities.some((activity) => activity.type === "read_later"),
  };
}

export async function recordPostRead(userId: string, slug: string) {
  const now = new Date();
  await prisma.memberPostActivity.upsert({
    where: { userId_slug_type: { userId, slug, type: "history" } },
    update: {
      lastReadAt: now,
      readCount: { increment: 1 },
    },
    create: {
      id: `act_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
      userId,
      slug,
      type: "history",
      lastReadAt: now,
      readCount: 1,
    },
  });
}

export async function setPostActivity(input: {
  userId: string;
  slug: string;
  type: Exclude<MemberPostActivityType, "history">;
  enabled: boolean;
}) {
  if (!input.enabled) {
    await prisma.memberPostActivity.deleteMany({
      where: { userId: input.userId, slug: input.slug, type: input.type },
    });
    return;
  }

  await prisma.memberPostActivity.upsert({
    where: { userId_slug_type: { userId: input.userId, slug: input.slug, type: input.type } },
    update: {},
    create: {
      id: `act_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
      userId: input.userId,
      slug: input.slug,
      type: input.type,
    },
  });
}
